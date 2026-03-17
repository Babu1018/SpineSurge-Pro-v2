import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Bell, Monitor, Lock, Languages } from "lucide-react";

export function SettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6 text-blue-600" />
                        Application Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure your workspace preferences and notifications.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Workspace</h4>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <Monitor className="h-4 w-4 text-slate-400" />
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium">Measurement Auto-save</div>
                                    <div className="text-[10px] text-muted-foreground">Automatically save changes to the cloud</div>
                                </div>
                            </div>
                            <div className="w-8 h-4 bg-blue-600 rounded-full cursor-pointer relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <Bell className="h-4 w-4 text-slate-400" />
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium">Analysis Notifications</div>
                                    <div className="text-[10px] text-muted-foreground">Alert when AI analysis is complete</div>
                                </div>
                            </div>
                            <div className="w-8 h-4 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer relative"><div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Security & Language</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="justify-start gap-2 h-10 border-slate-200 dark:border-slate-800">
                                <Languages className="h-4 w-4 text-slate-400" />
                                <span className="text-xs">English (US)</span>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-10 border-slate-200 dark:border-slate-800">
                                <Lock className="h-4 w-4 text-slate-400" />
                                <span className="text-xs">Change PIN</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs">Reset to Defaults</Button>
                    <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-8">Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
