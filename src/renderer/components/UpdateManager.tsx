/// <reference path="../../preload/index.d.ts" />
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Download, Info, AlertTriangle, RefreshCw } from 'lucide-react';

export const UpdateManager: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState<any>(null);
    const [updateReady, setUpdateReady] = useState<any>(null);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!window.spinesurge) return;

        const unsubscribeAvailable = window.spinesurge.onUpdateAvailable((info) => {
            setUpdateAvailable(info);
        });

        const unsubscribeReady = window.spinesurge.onUpdateReady((info) => {
            setUpdateReady(info);
            setDownloading(false);
        });

        const unsubscribeProgress = window.spinesurge.onUpdateProgress((p) => {
            setProgress(p);
        });

        const unsubscribeError = window.spinesurge.onUpdateError((err) => {
            setError(err);
            setDownloading(false);
        });

        return () => {
            unsubscribeAvailable();
            unsubscribeReady();
            unsubscribeProgress();
            unsubscribeError();
        };
    }, []);

    const handleDownload = () => {
        setDownloading(true);
        window.spinesurge.startUpdateDownload();
    };

    const handleInstall = () => {
        // Clinical safety check could be added here if needed
        window.spinesurge.quitAndInstallUpdate();
    };

    if (error) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-destructive/10 border border-destructive/20 rounded-xl shadow-2xl max-w-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-bold">Update Error</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mb-3">{error}</p>
                <Button variant="secondary" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </div>
        );
    }

    if (updateReady) {
        return (
            <Dialog open={true}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-green-500" />
                            Update Ready to Install
                        </DialogTitle>
                        <DialogDescription>
                            A new version of SpineSurge Pro ({updateReady.version}) has been downloaded and is ready to install.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                        <p className="text-sm font-bold mb-1 italic text-foreground">Clinical Safety Notice:</p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Please ensure all surgical plans and measurements are saved before restarting. The application will close and restart automatically.
                        </p>
                    </div>
                    <DialogFooter className="flex sm:justify-between items-center mt-4">
                        <Button variant="ghost" onClick={() => setUpdateReady(null)}>Wait</Button>
                        <Button className="bg-green-600 hover:bg-green-500 text-white" onClick={handleInstall}>
                            Restart & Install Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (downloading) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-card border border-border shadow-2xl rounded-2xl w-64 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">Downloading Update...</span>
                    <span className="text-xs text-primary font-mono font-bold">{progress?.percent?.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mb-1 overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${progress?.percent || 0}%` }}
                    />
                </div>
            </div>
        );
    }

    if (updateAvailable) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-primary text-primary-foreground rounded-2xl shadow-2xl w-72 animate-in fade-in slide-in-from-bottom-4 border border-primary/20">
                <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-md">
                        <Info className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold mb-1">New Update Available</h4>
                        <p className="text-[10px] text-white/80 mb-3 leading-relaxed">
                            Version {updateAvailable.version} is available. It includes important performance improvements for clinical rendering.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="h-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-4 rounded-lg shadow-md"
                                onClick={handleDownload}
                            >
                                <Download className="h-3 w-3 mr-1.5" />
                                Download
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-white hover:bg-white/10 px-3"
                                onClick={() => setUpdateAvailable(null)}
                            >
                                Later
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
