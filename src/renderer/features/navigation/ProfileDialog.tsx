import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, User, Shield, Calendar, Layers, Check } from "lucide-react";

import { useAppStore } from "@/lib/store/index";

export function ProfileDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const user = useAppStore(state => state.user);
    const updateUser = useAppStore(state => state.updateUser);

    const [localProfile, setLocalProfile] = useState(user || {
        name: "",
        title: "",
        email: "",
        specialty: "",
        joined: "",
        subsection: ""
    });

    useEffect(() => {
        if (user) setLocalProfile(user);
    }, [user, open]);

    const initial = useMemo(() => {
        const parts = localProfile.name.replace(/^(Dr\.|Mr\.|Ms\.)\s+/i, '').split(' ');
        return parts[0] ? parts[0][0].toUpperCase() : 'U';
    }, [localProfile.name]);

    const handleSave = () => {
        updateUser(localProfile);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6 text-blue-600" />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Modify your professional profile details.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center py-6 gap-4">
                    <Avatar className="h-24 w-24 border-4 border-blue-600/20 shadow-xl transition-all">
                        <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-2 px-4">
                        <div className="grid gap-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center">Full Name</Label>
                            <Input
                                value={localProfile.name}
                                onChange={e => setLocalProfile({ ...localProfile, name: e.target.value })}
                                className="text-center font-bold text-lg bg-transparent border-none hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 h-8 font-inherit"
                            />
                        </div>
                        <Input
                            value={localProfile.title}
                            onChange={e => setLocalProfile({ ...localProfile, title: e.target.value })}
                            className="text-center text-sm text-muted-foreground bg-transparent border-none hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 h-7"
                        />
                    </div>
                </div>

                <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                value={localProfile.email}
                                onChange={e => setLocalProfile({ ...localProfile, email: e.target.value })}
                                className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Specialty</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    value={localProfile.specialty}
                                    onChange={e => setLocalProfile({ ...localProfile, specialty: e.target.value })}
                                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Joined</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={localProfile.joined}
                                    onChange={e => setLocalProfile({ ...localProfile, joined: e.target.value })}
                                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Subsection</Label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="e.g. Lumbar, Cervical..."
                                value={localProfile.subsection}
                                onChange={e => setLocalProfile({ ...localProfile, subsection: e.target.value })}
                                className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-8 shadow-lg shadow-blue-900/20">
                        <Check className="h-4 w-4" />
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
