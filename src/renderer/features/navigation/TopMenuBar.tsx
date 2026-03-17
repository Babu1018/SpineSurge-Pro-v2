import {
    Upload,
    ArrowLeftRight,
    Download,
    FolderOpen,
    LogOut,
    Moon,
    Sun,
    Settings,
    User,
    Anchor,
    RotateCcw,
    RotateCw,
    FlipHorizontal,
    Undo2,
    Redo2,
    Camera,
    Contrast,
    Focus,
    ZoomIn,
    Crop,
    RefreshCcw,
    MoveHorizontal,
    LayoutTemplate,
    Grid2X2,
    Share2,
    Target
} from "lucide-react";
import { ImportDialog } from "@/features/import-export/ImportDialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";

import { useState, useRef } from "react";
import { ProfileDialog } from "./ProfileDialog";
import { SettingsDialog } from "./SettingsDialog";
import { ReportDialog } from "./ReportDialog";
import { ShareDialog } from "./ShareDialog";
import { useAppStore } from "@/lib/store/index";
import { cn } from "@/lib/utils";
import Logo from "@/assets/Logo.png";

const TopMenuBar = () => {
    const { setTheme, theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        user,
        logout,
        activePatientId,
        currentImage,
        activeContextId,
        addContext,
        updateContextState,
        generateShareLink,
        measurements,
        implants,
        threeDImplants,
        pedicleSimulations,
        isComparisonMode,
        setComparisonMode,
        isToolbarDocked,
        toggleToolbarDock,
        canvas,
        setBrightness,
        setContrast,
        setSharpness,
        setZoom,
        setRotation,
        toggleFlipX,
        resetCanvas,
        undo,
        redo,
        activeTool,
        setActiveTool,
        isDicomMode,
        dicomSeries,
        dicom3D,
        setDicomLayoutMode,
        setDicomCroppingActive,
        triggerFocusCrop,
        setActiveDialog,
        isLiveConnected
    } = useAppStore();

    const [profileOpen, setProfileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // Track the last main route for smart navigation
    const lastMainRouteRef = useRef('/dashboard');

    // Update lastMainRoute when on dashboard or compare page
    if (location.pathname === '/dashboard' || location.pathname === '/compare') {
        lastMainRouteRef.current = location.pathname;
    }

    const userInitial = user?.name
        ? user.name.replace(/^(Dr\.|Mr\.|Ms\.)\s+/i, '').charAt(0).toUpperCase()
        : 'U';

    // Smart navigation handlers
    const handleCompareToggle = () => {
        // If we are on cases page, clicking compare should always take us to compare page
        if (location.pathname === '/cases') {
            setComparisonMode(true);
            navigate('/compare');
            return;
        }

        const nextMode = !isComparisonMode;
        setComparisonMode(nextMode);
        if (nextMode) {
            navigate('/compare');
        } else {
            navigate('/dashboard');
        }
    };

    const handlePatientsToggle = () => {
        if (location.pathname === '/cases') {
            // Going back from patients page to the last main route
            navigate(lastMainRouteRef.current);
        } else {
            // Going to patients page
            navigate('/cases');
        }
    };

    return (
        <div className="h-10 border-b bg-background flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50 shadow-sm backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
            {/* Left: Logo */}
            <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                    setComparisonMode(false);
                    navigate('/dashboard');
                }}
            >
                <img src={Logo} alt="SpineSurge" className="h-8 w-auto object-contain dark:brightness-100 brightness-0" />
            </div>

            {/* Center: Docked Toolbar or Placeholder */}
            {isToolbarDocked ? (
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-secondary/80 p-1.5 rounded-xl border border-border shadow-lg backdrop-blur-md max-w-[50%] overflow-x-auto scrollbar-none transition-all duration-300">
                    {/* Visual Adjustments */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={() => setBrightness(Math.max(0, canvas.brightness - 10))} title="Brightness">
                        <Sun className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={() => setContrast(Math.max(0, canvas.contrast - 10))} title="Contrast">
                        <Contrast className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={() => setSharpness(Math.max(0, canvas.sharpness - 10))} title="Sharpness">
                        <Focus className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-5 bg-border/40 mx-1" />

                    {/* Navigation */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={() => setZoom(Math.max(0.1, canvas.zoom - 0.1))} title="Zoom Out">
                        <ZoomIn className="h-4 w-4 scale-x-[-1]" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 rounded-lg transition-colors", activeTool === 'zoom' ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted")}
                        onClick={() => setActiveTool(activeTool === 'zoom' ? null : 'zoom')}
                        title="Zoom Tool"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 rounded-lg transition-colors", activeTool === 'pan' ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted")}
                        onClick={() => setActiveTool(activeTool === 'pan' ? null : 'pan')}
                        title="Pan Tool"
                    >
                        <MoveHorizontal className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-5 bg-border/40 mx-1" />

                    {/* Manipulations */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={() => setRotation((canvas.rotation - 90) % 360)} title="Rotate Left">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={() => setRotation((canvas.rotation + 90) % 360)} title="Rotate Right">
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={toggleFlipX} title="Flip Horizontal">
                        <FlipHorizontal className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 rounded-lg transition-colors", activeTool === 'crop' ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted")}
                        onClick={() => setActiveTool(activeTool === 'crop' ? null : 'crop')}
                        title="Crop"
                    >
                        <Crop className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={resetCanvas} title="Reset All">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-5 bg-border/40 mx-1" />

                    {/* History & Capture */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={undo} title="Undo">
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" onClick={redo} title="Redo">
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg transition-colors" title="Capture">
                        <Camera className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-5 bg-border/40 mx-1" />

                    {/* Undock */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500 rounded-lg transition-colors" onClick={toggleToolbarDock} title="Undock Toolbar">
                        <Anchor className="h-4 w-4" />
                    </Button>
                </div >
            ) : (
                <div className="flex-1" />
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-4">

                {/* DICOM Layout Toggle - Only when in DICOM mode */}
                {isDicomMode && (
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50 mr-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDicomLayoutMode('axial-sagittal')}
                            className={cn(
                                "h-8 w-12 rounded transition-colors flex items-center justify-center gap-1",
                                dicom3D.layoutMode === 'axial-sagittal' ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-400 hover:text-white"
                            )}
                            title="2D Layout (Axial/Coronal Left, Sagittal Right)"
                        >
                            <LayoutTemplate className="w-4 h-4 rotate-90" />
                            <span className="text-[10px] font-bold ml-1">2D</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDicomLayoutMode('grid')}
                            className={cn(
                                "h-8 w-8 rounded transition-colors",
                                dicom3D.layoutMode === 'grid' ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-400 hover:text-white"
                            )}
                            title="Standard 2x2 Grid"
                        >
                            <Grid2X2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDicomLayoutMode('focus-3d')}
                            className={cn(
                                "h-8 w-8 rounded transition-colors",
                                dicom3D.layoutMode === 'focus-3d' ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-400 hover:text-white"
                            )}
                            title="3D Focus (3 Slices Top, 3D Bottom Wide)"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* DICOM Shortcuts - Crop & Focus */}
                {isDicomMode && (
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDicomCroppingActive(!dicom3D.isCroppingActive)}
                            className={cn(
                                "h-8 w-8 rounded transition-all",
                                dicom3D.isCroppingActive ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                            title="Toggle 3D ROI Crop"
                        >
                            <Crop className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={triggerFocusCrop}
                            className="h-8 w-8 rounded text-primary hover:bg-primary/10 transition-all"
                            title="Focus on Cropped Region"
                        >
                            <Target className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Icons Group - Unified gap, uniform distance */}
                <div className="flex items-center gap-4">
                    <ImportDialog>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-secondary hover:bg-muted shadow-sm border border-border transition-all active:scale-95 text-foreground"
                            title="Import Scan"
                        >
                            <Upload className="h-4.5 w-4.5" />
                        </Button>
                    </ImportDialog>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full border border-border transition-all active:scale-95 shadow-sm",
                            isComparisonMode
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-secondary hover:bg-muted text-foreground"
                        )}
                        title="Compare"
                        onClick={handleCompareToggle}
                    >
                        <ArrowLeftRight className="h-4.5 w-4.5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-secondary hover:bg-muted shadow-sm border border-border transition-all active:scale-95 text-foreground"
                        title="Export Report"
                        onClick={() => {
                            setReportOpen(true);
                            setActiveDialog('report');
                        }}
                    >
                        <Download className="h-4.5 w-4.5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full shadow-sm border border-border transition-all active:scale-95",
                            location.pathname === '/cases'
                                ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                                : "bg-secondary hover:bg-muted text-foreground"
                        )}
                        onClick={handlePatientsToggle}
                        title={location.pathname === '/cases' ? 'Back to Workspace' : 'Patient Cases'}
                    >
                        <FolderOpen className="h-4.5 w-4.5" />
                    </Button>

                    <div className="flex items-center gap-2">
                        {isLiveConnected && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 mr-1 animate-pulse">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-secondary hover:bg-muted shadow-sm border border-border transition-all active:scale-95 text-foreground"
                            title="Share Workspace"
                            onClick={async () => {
                                // Scenario 1: Active Context (already saved/shared state)
                                if (activeContextId) {
                                    generateShareLink();
                                    return;
                                }

                                const newId = crypto.randomUUID();

                                // Scenario 2: DICOM Mode (Create snapshot linked to Study)
                                if (isDicomMode && dicomSeries.length > 0 && typeof dicomSeries[0] === 'string') {
                                    const targetUrl = dicomSeries[0] as string;
                                    let foundStudyId: string | undefined;
                                    let foundPatientId: string | undefined = activePatientId || undefined;

                                    // Helper: Check if a patient has this scan
                                    // Handles full URL vs relative path matching
                                    const findStudy = (p: any) => {
                                        return p.studies.find((s: any) =>
                                            s.scans.some((scan: any) =>
                                                targetUrl.includes(scan.imageUrl) || scan.imageUrl.includes(targetUrl)
                                            )
                                        );
                                    };

                                    const state = useAppStore.getState();
                                    const allPatients = state.patients;

                                    // Try to find the study in active patient or all patients
                                    let study: any;
                                    if (activePatientId) {
                                        const p = allPatients.find((p: any) => p.id === activePatientId);
                                        if (p) study = findStudy(p);
                                    }

                                    if (!study) {
                                        // Search all patients
                                        for (const p of allPatients) {
                                            study = findStudy(p);
                                            if (study) {
                                                foundPatientId = p.id;
                                                break;
                                            }
                                        }
                                    }

                                    if (study && foundPatientId) {
                                        foundStudyId = study.id;

                                        await addContext({
                                            id: newId,
                                            patientId: foundPatientId as string,
                                            studyIds: [foundStudyId as string],
                                            mode: 'view',
                                            name: `Shared DICOM ${new Date().toLocaleDateString()}`,
                                            lastModified: new Date().toISOString()
                                        });

                                        // Save 3D State
                                        // We use the current state from the store directly or pass `threeDImplants` etc which are available in scope.
                                        await updateContextState(newId, {
                                            threeDImplants,
                                            pedicleSimulations,
                                            // Add other DICOM state if needed
                                            // dicom3D settings?
                                        });

                                        generateShareLink({ contextId: newId });
                                        return;
                                    }
                                }

                                // Scenario 3: Canvas Mode with Image (Create Snapshot)
                                if (activePatientId && currentImage && !isDicomMode) {
                                    await addContext({
                                        id: newId,
                                        patientId: activePatientId,
                                        studyIds: [],
                                        mode: 'view',
                                        name: `Shared Snapshot ${new Date().toLocaleDateString()}`,
                                        lastModified: new Date().toISOString()
                                    });
                                    await updateContextState(newId, {
                                        measurements,
                                        implants,
                                        threeDImplants, // Should be empty in canvas mode usually but safe to include
                                        pedicleSimulations,
                                        currentImage
                                    });
                                    generateShareLink({ contextId: newId });
                                    return;
                                }

                                // Fallback: just open dialog with default link (e.g. current URL or patient)
                                generateShareLink();
                            }}
                        >
                            <Share2 className="h-4.5 w-4.5" />
                        </Button>
                    </div>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-secondary hover:bg-muted shadow-sm border border-border transition-all active:scale-95 text-foreground"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        title="Toggle Theme"
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>

                    {/* Profile Menu - Minimal, only the circle for initial */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 p-0 hover:bg-transparent">
                                <div className="w-7 h-7 rounded-full bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center border border-blue-500/20 hover:border-blue-500/50 transition-colors">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{userInitial}</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className={cn(
                                "w-60 backdrop-blur-xl shadow-2xl z-[100] rounded-2xl p-2 font-['Outfit'] border",
                                theme === 'dark'
                                    ? "bg-black/80 text-zinc-50 border-zinc-800/50"
                                    : "bg-white/95 text-zinc-950 border-zinc-200/50"
                            )}
                        >
                            <DropdownMenuLabel className="font-normal p-3">
                                <div className="flex flex-col space-y-1">
                                    <p className={cn(
                                        "text-sm font-bold leading-none tracking-tight",
                                        theme === 'dark' ? "text-zinc-50" : "text-zinc-950"
                                    )}>{user?.name || "User"}</p>
                                    <p className={cn(
                                        "text-xs leading-none font-medium",
                                        theme === 'dark' ? "text-zinc-400" : "text-zinc-500"
                                    )}>{user?.email || "demo@spine.com"}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className={cn(
                                "opacity-20",
                                theme === 'dark' ? "bg-zinc-800" : "bg-zinc-200"
                            )} />
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer rounded-xl p-2.5 font-bold transition-all",
                                    theme === 'dark'
                                        ? "text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                                        : "text-zinc-950 hover:bg-zinc-100 focus:bg-zinc-100"
                                )}
                                onClick={() => { setProfileOpen(true); setActiveDialog('profile'); }}
                            >
                                <User className="mr-2 h-4 w-4 text-primary" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer rounded-xl p-2.5 font-bold transition-all",
                                    theme === 'dark'
                                        ? "text-zinc-50 hover:bg-zinc-800 focus:bg-zinc-800"
                                        : "text-zinc-950 hover:bg-zinc-100 focus:bg-zinc-100"
                                )}
                                onClick={() => { setSettingsOpen(true); setActiveDialog('settings'); }}
                            >
                                <Settings className="mr-2 h-4 w-4 text-primary" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className={cn(
                                "opacity-20",
                                theme === 'dark' ? "bg-zinc-800" : "bg-zinc-200"
                            )} />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10"
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <ProfileDialog open={profileOpen} onOpenChange={(val) => { setProfileOpen(val); setActiveDialog(val ? 'profile' : null); }} />
                <SettingsDialog open={settingsOpen} onOpenChange={(val) => { setSettingsOpen(val); setActiveDialog(val ? 'settings' : null); }} />
                <ReportDialog open={reportOpen} onOpenChange={(val) => { setReportOpen(val); setActiveDialog(val ? 'report' : null); }} checkedCount={measurements.filter(m => m.selected).length} />
                <ShareDialog />
            </div>
        </div >
    );
};

export default TopMenuBar;
