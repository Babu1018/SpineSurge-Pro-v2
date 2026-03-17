/// <reference path="../../../preload/index.d.ts" />
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    FilePlus,
    Users,
    UserPlus,
    ChevronLeft,
    Search as SearchIcon,
    Check,
    Plus,
    Upload,
    Image as ImageIcon,
    Calendar,
    ArrowRight,
    FolderInput // Added
} from "lucide-react"
import { useRef, useState, useMemo } from "react"
import { useAppStore, Patient, Visit } from "@/lib/store/index";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

type ImportStep =
    | 'MODE'
    | 'NEW_PATIENT'
    | 'SEARCH_PATIENT'
    | 'VISIT_CHOICE'
    | 'NEW_VISIT'
    | 'SELECT_VISIT'
    | 'SELECT_VISIT'
    | 'SCAN_UPLOAD'
    | 'DICOM_FOLDER' // Added

export function ImportDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<ImportStep>('MODE')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const folderInputRef = useRef<HTMLInputElement>(null) // Added

    // Store State
    const {
        patients,
        addPatient,
        addVisit,
        addScan,
        loadImage,
        isComparisonMode,
        activeCanvasSide,
        setComparisonImage,
        setActiveDialog
    } = useAppStore()

    // Selection State
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Form States
    const [patientData, setPatientData] = useState({ name: '', id: '', age: '', gender: 'M', dob: '' })
    const [visitData, setVisitData] = useState({ diagnosis: '', height: '', weight: '', consultant: 'Dr. Muthuraman (SRIHER)', comments: '' })
    const [scanData, setScanData] = useState({ type: 'Pre-op' as 'Pre-op' | 'Post-op', date: format(new Date(), 'yyyy-MM-dd') })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const filteredPatients = useMemo(() => {
        return patients.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [patients, searchQuery])

    // Handlers
    const resetWizard = () => {
        setStep('MODE')
        setSelectedPatient(null)
        setSelectedVisit(null)
        setSearchQuery('')
        setPatientData({ name: '', id: '', age: '', gender: 'M', dob: '' })
        setVisitData({ diagnosis: '', height: '', weight: '', consultant: 'Dr. Muthuraman (SRIHER)', comments: '' })
        setSelectedFile(null)
    }
    const handleClose = () => {
        setOpen(false)
        setActiveDialog(null)
        resetWizard()
    }

    const handleQuickUse = () => {
        fileInputRef.current?.click()
    }

    const handleQuickFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            try {
                const patientId = `quick-${Date.now()}`;
                const studyId = `std-${Date.now()}`;

                // 1. Create a "Quick Patient" on the server so we have a place to link the scan
                await addPatient({
                    id: patientId,
                    name: "Quick Analysis",
                    age: 0,
                    gender: 'O',
                    dob: '',
                    lastVisit: new Date().toISOString(),
                    visits: [],
                    studies: []
                });

                // 2. Add Study
                await useAppStore.getState().addStudy({
                    id: studyId,
                    patientId,
                    modality: 'Import',
                    source: 'Quick Use',
                    acquisitionDate: new Date().toISOString()
                });

                // 3. Upload Scan (This now hits the server)
                await addScan(patientId, studyId, {
                    id: `scan-${Date.now()}`,
                    type: 'Pre-op',
                    date: new Date().toISOString().split('T')[0]
                }, file);

                // 4. Get the URL from the patient record (it's now a server URL)
                const state = useAppStore.getState();
                const patient = state.patients.find(p => p.id === patientId);
                const serverUrl = patient?.studies?.find(s => s.id === studyId)?.scans?.[0]?.imageUrl;

                if (serverUrl) {
                    if (isComparisonMode && activeCanvasSide) {
                        setComparisonImage(activeCanvasSide, serverUrl)
                    } else {
                        loadImage(serverUrl)
                    }
                }
            } catch (err) {
                console.error("Quick Use upload failed:", err);
                alert("Failed to upload image for Quick Use. Please try again.");
            }
            handleClose()
        }
    }

    const handleDicomFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // Convert to Array
            const fileArray = Array.from(files);

            // Switch to DICOM Mode
            useAppStore.getState().loadDicomSeries(fileArray);

            handleClose()
        }
    }

    const handleNativeFolderSelect = async () => {
        // Trigger the hidden folder input
        folderInputRef.current?.click();
    }

    const handleCreatePatient = () => {
        const newPatient: Patient = {
            id: patientData.id || `#${Math.floor(Math.random() * 1000000000)}`,
            name: patientData.name,
            age: parseInt(patientData.age),
            gender: patientData.gender as 'M' | 'F' | 'O',
            dob: patientData.dob,
            lastVisit: format(new Date(), 'MMM dd, yyyy'),
            visits: [],
            studies: []
        }
        addPatient(newPatient)
        setSelectedPatient(newPatient)
        setStep('NEW_VISIT')
    }

    const handleCreateVisit = () => {
        if (!selectedPatient) return
        const newVisit: Visit = {
            id: Date.now().toString(),
            visitNumber: `#${String(selectedPatient.visits.length + 1).padStart(4, '0')}`,
            date: format(new Date(), 'MMMM dd, yyyy'),
            time: format(new Date(), 'hh:mm a'),
            diagnosis: visitData.diagnosis || 'New Diagnosis',
            comments: visitData.comments,
            height: visitData.height ? `${visitData.height} cm` : '',
            weight: visitData.weight ? `${visitData.weight} kg` : '',
            consultants: visitData.consultant,
            scanCount: 0,
            scans: [],
            studies: []
        }
        addVisit(selectedPatient.id, newVisit)
        setSelectedVisit(newVisit)
        setStep('SCAN_UPLOAD')
    }

    const handleFinalImport = async () => {
        if (!selectedPatient || !selectedVisit || !selectedFile) return

        const scanId = Date.now().toString()
        await addScan(selectedPatient.id, selectedVisit.id, {
            id: scanId,
            type: scanData.type,
            date: scanData.date
        }, selectedFile)

        // 4. Get the URL from the patient record (it's now a server URL)
        const state = useAppStore.getState();
        // Scan was added to a study? addScan implementation finds the study.
        // We know patientId and studyId? Wait, addScan takes studyId.
        // In handleFinalImport, we are adding to a VISIT, not explicitly a STUDY?
        // Let's check api.addScan args in ImportDialog: addScan(patientId, visitId, ...) 
        // Wait, PatientSlice.addScan signature is: addScan(patientId, studyId, ...)
        // BUT in ImportDialog handleFinalImport line 216: addScan(selectedPatient.id, selectedVisit.id, ...)
        // pass visitId as studyId? That seems implied if Visit has studies?
        // Let's look at addScan in PatientSlice again.

        // Actually, looking at ImportDialog:
        // await addScan(selectedPatient.id, selectedVisit.id, ...)
        // It passes visitId as second arg.

        // Let's trust that addScan updates the store. We can try to find the scan by ID or just use the return if we refactor addScan to return it?
        // PatientSlice addScan doesn't return the URL. ActivePatient updates though.

        // Alternative: Just fetch the patient again or find the scan in the updated store.
        // We know the scan ID is `scanId`.

        const updatedPatient = state.patients.find(p => p.id === selectedPatient.id);
        let serverUrl: string | undefined;

        // Search in all studies of the patient/visit
        updatedPatient?.studies.forEach(s => {
            const found = s.scans.find(scan => scan.id === scanId);
            if (found) serverUrl = found.imageUrl;
        });

        // If not found in studies (maybe linked via visit?), check visit specific logic if needed?
        // Usually scans are effectively in studies.

        // Fallback or verify.
        if (serverUrl) {
            console.log('[ImportDialog] handleFinalImport: Using Server URL', serverUrl);
            if (isComparisonMode && activeCanvasSide) {
                setComparisonImage(activeCanvasSide, serverUrl)
            } else {
                loadImage(serverUrl)
            }
        } else {
            // Fallback to Blob if server sync hasn't propagated or wait?
            // It's async await addScan, so store should be updated.
            const url = URL.createObjectURL(selectedFile);
            console.warn('[ImportDialog] Server URL not found, using Blob', url);
            if (isComparisonMode && activeCanvasSide) {
                setComparisonImage(activeCanvasSide, url)
            } else {
                loadImage(url)
            }
        }

        handleClose()
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            setActiveDialog(val ? 'import' : null);
            if (!val) resetWizard();
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                {/* Header Section */}
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                        {step !== 'MODE' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => {
                                if (step === 'NEW_PATIENT' || step === 'SEARCH_PATIENT') setStep('MODE')
                                else if (step === 'VISIT_CHOICE') setStep('SEARCH_PATIENT')
                                else if (step === 'NEW_VISIT' || step === 'SELECT_VISIT') setStep('VISIT_CHOICE')
                                else if (step === 'SCAN_UPLOAD') {
                                    if (selectedVisit?.scans?.length === 0) setStep('NEW_VISIT') // Simplification
                                    else setStep('VISIT_CHOICE')
                                }
                            }}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <DialogTitle className="text-xl font-bold">
                            {step === 'MODE' && "Import Scan"}
                            {step === 'NEW_PATIENT' && "New Patient Record"}
                            {step === 'SEARCH_PATIENT' && "Select Patient"}
                            {step === 'VISIT_CHOICE' && "Visit Information"}
                            {step === 'NEW_VISIT' && "Create Visit"}
                            {step === 'SELECT_VISIT' && "Select Existing Visit"}
                            {step === 'SCAN_UPLOAD' && "Upload & Categorize"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground">
                        {step === 'MODE' && (isComparisonMode ? `Importing scan for View ${activeCanvasSide === 'left' ? 'A' : 'B'}` : "Select how you'd like to process this scan.")}
                        {step === 'SEARCH_PATIENT' && "Find an existing patient record."}
                        {step === 'VISIT_CHOICE' && `Patient: ${selectedPatient?.name}`}
                        {step === 'SCAN_UPLOAD' && `Visit: ${selectedVisit?.visitNumber} - ${selectedVisit?.date}`}
                    </DialogDescription>
                </div>

                <div className="p-6">
                    {/* Step: MODE */}
                    {step === 'MODE' && (
                        <div className="grid gap-3">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleQuickFileChange} />

                            <ModeButton
                                icon={FilePlus}
                                title="Quick Use"
                                desc="Analyze immediately without saving."
                                onClick={handleQuickUse}
                            />
                            <ModeButton
                                icon={UserPlus}
                                title="Add New Patient"
                                desc="Register a new patient and start analysis."
                                onClick={() => setStep('NEW_PATIENT')}
                            />
                            <ModeButton
                                icon={Users}
                                title="Use Existing Patient"
                                desc="Link scan to an existing patient record."
                                onClick={() => setStep('SEARCH_PATIENT')}
                            />
                            <ModeButton
                                icon={FolderInput}
                                title="Import DICOM Folder"
                                desc="Load a folder of DICOM files for MPR view."
                                onClick={handleNativeFolderSelect}
                            />
                            {/* Hidden directory input */}
                            <input
                                type="file"
                                ref={folderInputRef}
                                className="hidden"
                                // @ts-ignore - webkitdirectory is non-standard but supported
                                webkitdirectory=""
                                directory=""
                                multiple
                                onChange={handleDicomFolderSelect}
                            />
                        </div>
                    )}

                    {/* Step: NEW_PATIENT */}
                    {step === 'NEW_PATIENT' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem label="Full Name" placeholder="Dr. John Doe">
                                    <Input value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })} className="bg-background border-border text-foreground h-10 rounded-xl" />
                                </FormItem>
                                <FormItem label="Patient ID (Optional)" placeholder="Auto-generated">
                                    <Input value={patientData.id} onChange={e => setPatientData({ ...patientData, id: e.target.value })} className="bg-background border-border text-foreground h-10 rounded-xl" />
                                </FormItem>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormItem label="Age">
                                    <Input type="number" value={patientData.age} onChange={e => setPatientData({ ...patientData, age: e.target.value })} className="bg-background border-border text-foreground" />
                                </FormItem>
                                <FormItem label="Sex">
                                    <select value={patientData.gender} onChange={e => setPatientData({ ...patientData, gender: e.target.value })} className="w-full bg-background border-border border text-foreground rounded-xl h-10 px-3 text-sm focus:ring-1 focus:ring-primary/20 outline-none">
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                </FormItem>
                                <FormItem label="DOB">
                                    <Input type="date" value={patientData.dob} onChange={e => setPatientData({ ...patientData, dob: e.target.value })} className="bg-background border-border text-foreground h-10 rounded-xl" />
                                </FormItem>
                            </div>
                            <Button className="w-full bg-primary hover:bg-primary/90 mt-4 h-11 text-primary-foreground font-bold rounded-xl" onClick={handleCreatePatient} disabled={!patientData.name || !patientData.age}>
                                Next: Create Visit <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step: SEARCH_PATIENT */}
                    {step === 'SEARCH_PATIENT' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or ID..."
                                    className="pl-9 bg-background border-border text-foreground"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <ScrollArea className="h-[280px] rounded-xl border border-border bg-muted/20 p-2">
                                {filteredPatients.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                        <Users className="h-8 w-8 mb-2" />
                                        <p className="text-xs">No patients found</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-1">
                                        {filteredPatients.map(p => (
                                            <button
                                                key={p.id}
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-600/10 hover:border-blue-500/50 border border-transparent transition-all text-left"
                                                onClick={() => { setSelectedPatient(p); setStep('VISIT_CHOICE'); }}
                                            >
                                                <div>
                                                    <div className="text-sm font-bold text-foreground">{p.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">{p.id} • {p.age}y {p.gender}</div>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">Last: {p.lastVisit}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    {/* Step: VISIT_CHOICE */}
                    {step === 'VISIT_CHOICE' && (
                        <div className="grid grid-cols-2 gap-4">
                            <ModeButton
                                icon={Plus}
                                title="New Visit"
                                desc="Start a fresh consultation."
                                onClick={() => setStep('NEW_VISIT')}
                            />
                            <ModeButton
                                icon={Calendar}
                                title="Existing Visit"
                                desc="Attach scan to previous visit."
                                onClick={() => setStep('SELECT_VISIT')}
                                disabled={selectedPatient?.visits.length === 0}
                            />
                        </div>
                    )}

                    {/* Step: NEW_VISIT */}
                    {step === 'NEW_VISIT' && (
                        <div className="space-y-4">
                            <FormItem label="Initial Diagnosis">
                                <Input value={visitData.diagnosis} onChange={e => setVisitData({ ...visitData, diagnosis: e.target.value })} placeholder="e.g. Spondylolisthesis" className="bg-background border-border text-foreground h-10 rounded-xl" />
                            </FormItem>
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem label="Height (cm)">
                                    <Input type="number" value={visitData.height} onChange={e => setVisitData({ ...visitData, height: e.target.value })} className="bg-background border-border text-foreground h-10 rounded-xl" />
                                </FormItem>
                                <FormItem label="Weight (kg)">
                                    <Input type="number" value={visitData.weight} onChange={e => setVisitData({ ...visitData, weight: e.target.value })} className="bg-background border-border text-foreground h-10 rounded-xl" />
                                </FormItem>
                            </div>
                            <FormItem label="Clinical Notes">
                                <Textarea value={visitData.comments} onChange={e => setVisitData({ ...visitData, comments: e.target.value })} className="bg-background border-border text-foreground min-h-[80px] rounded-xl resize-none" />
                            </FormItem>
                            <Button className="w-full bg-primary hover:bg-primary/90 h-11 text-primary-foreground font-bold rounded-xl" onClick={handleCreateVisit}>
                                Next: Upload Scans <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step: SELECT_VISIT */}
                    {step === 'SELECT_VISIT' && (
                        <ScrollArea className="h-[300px] border border-border rounded-xl p-2 bg-muted/20">
                            <div className="grid gap-2">
                                {selectedPatient?.visits.map(v => (
                                    <button
                                        key={v.id}
                                        className="p-3 text-left border border-border rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all group"
                                        onClick={() => { setSelectedVisit(v); setStep('SCAN_UPLOAD'); }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-primary">{v.visitNumber}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{v.date}</span>
                                        </div>
                                        <div className="text-sm font-bold text-foreground truncate">{v.diagnosis}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1 italic font-medium opacity-70">{v.consultants}</div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}

                    {/* Step: SCAN_UPLOAD */}
                    {step === 'SCAN_UPLOAD' && (
                        <div className="space-y-6">
                            <div className="flex gap-4 justify-center">
                                <Button
                                    variant={scanData.type === 'Pre-op' ? 'default' : 'outline'}
                                    className={cn("flex-1 rounded-xl font-bold h-10", scanData.type === 'Pre-op' ? 'bg-primary text-primary-foreground' : 'border-border')}
                                    onClick={() => setScanData({ ...scanData, type: 'Pre-op' })}
                                >
                                    Pre-op
                                </Button>
                                <Button
                                    variant={scanData.type === 'Post-op' ? 'default' : 'outline'}
                                    className={cn("flex-1 rounded-xl font-bold h-10", scanData.type === 'Post-op' ? 'bg-indigo-600 text-white' : 'border-border')}
                                    onClick={() => setScanData({ ...scanData, type: 'Post-op' })}
                                >
                                    Post-op
                                </Button>
                            </div>

                            <div
                                className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-primary/10 p-3 rounded-full mb-3">
                                            <ImageIcon className="h-8 w-8 text-primary" />
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{selectedFile.name}</span>
                                        <span className="text-xs font-medium opacity-60">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 mb-3 group-hover:scale-110 group-hover:text-primary transition-all opacity-40" />
                                        <span className="text-sm font-medium">Click to select Scan image</span>
                                        <span className="text-[10px] mt-1 opacity-50">DICOM, JPG, PNG supported</span>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground text-xs uppercase font-bold pr-2 border-r border-border h-full flex items-center justify-end">Scan Date</Label>
                                <Input type="date" value={scanData.date} onChange={e => setScanData({ ...scanData, date: e.target.value })} className="col-span-3 bg-background border-border text-foreground h-10 rounded-xl font-bold" />
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 h-12 shadow-lg shadow-primary/20 font-bold text-primary-foreground rounded-xl"
                                disabled={!selectedFile}
                                onClick={handleFinalImport}
                            >
                                Finalize & Import <Check className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ModeButton({ icon: Icon, title, desc, onClick, disabled = false }: any) {
    return (
        <Button
            variant="outline"
            className="h-auto py-4 px-5 justify-start gap-4 bg-muted/30 border-border hover:bg-primary/10 hover:border-primary/50 transition-all group rounded-2xl"
            onClick={onClick}
            disabled={disabled}
        >
            <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary transition-colors">
                <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
            </div>
            <div className="text-left">
                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{title}</div>
                <div className="text-[10px] text-muted-foreground font-medium">{desc}</div>
            </div>
        </Button>
    )
}

function FormItem({ label, children }: any) {
    return (
        <div className="space-y-1.5 flex-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{label}</Label>
            {children}
        </div>
    )
}
