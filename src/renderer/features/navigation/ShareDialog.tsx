import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store/index";

export const ShareDialog = () => {
    const { shareDialogOpen, setShareDialogOpen, generatedLink } = useAppStore();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-border bg-card/95 backdrop-blur-xl shadow-2xl font-['Outfit']">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Share2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Share Workspace</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">
                                Anyone with this link can view this clinical case.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="relative group">
                        <Input
                            readOnly
                            value={generatedLink}
                            className="bg-muted/50 border-border pr-12 h-12 rounded-2xl font-medium focus:ring-primary/20 transition-all text-sm"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1 h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-bold text-primary mr-1">Note:</span>
                        This link provides direct access to the current patient and planning session. It's intended for secure clinical collaboration.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                        onClick={handleCopy}
                    >
                        {copied ? "Copied to Clipboard!" : "Copy Share Link"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
