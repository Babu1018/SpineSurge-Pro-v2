/// <reference path="../../../preload/index.d.ts" />
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Check, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store/index";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "@/lib/api";

export function ReportDialog({ open, onOpenChange, checkedCount }: { open: boolean, onOpenChange: (open: boolean) => void, checkedCount: number }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [saveToRecord, setSaveToRecord] = useState(true);
    const {
        isComparisonMode,
        activeCanvasSide,
        comparison,
        measurements: storeMeasurements,
        user,
        patients,
        activePatientId
    } = useAppStore();

    const measurements = useMemo(() => {
        if (isComparisonMode && activeCanvasSide) {
            return comparison[activeCanvasSide].measurements;
        }
        return storeMeasurements;
    }, [isComparisonMode, activeCanvasSide, comparison, storeMeasurements]);

    const activePatient = patients.find(p => p.id === activePatientId);

    const handleExportPDF = async () => {
        setIsGenerating(true);
        console.log("Starting PDF generation...");
        try {
            const selectedMeasurements = measurements.filter(m => m.selected);
            if (selectedMeasurements.length === 0) {
                alert("No measurements selected for the report.");
                setIsGenerating(false);
                return;
            }

            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // --- PREMIUM BLUE HEADER ---
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, pageWidth, 45, 'F');

            // Logo Placeholder
            doc.setFillColor(255, 255, 255);
            doc.rect(15, 12, 18, 18, 'F');
            doc.setTextColor(37, 99, 235);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Logo", 24, 23, { align: 'center' });

            // Left side Header Content: Hospital -> Dept -> Spinesurge -> Documentation
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("General Hospital", 40, 18);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("Department of Spine Surgery", 40, 23);

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("SPINESURGE", 40, 31);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("PLAN DOCUMENTATION", 40, 36);

            // Right side Header Content: Meta info
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            const refNo = `SS-${Math.floor(100000 + Math.random() * 900000)}`;
            doc.text(`REF: ${refNo}`, pageWidth - 15, 20, { align: 'right' });
            doc.text(`PLAN DATE: ${new Date().toLocaleDateString()}`, pageWidth - 15, 26, { align: 'right' });

            // Comparison Dates logic
            if (isComparisonMode) {
                const findScanDate = (url: string | null) => {
                    if (!url) return null;
                    for (const p of patients) {
                        for (const s of p.studies) {
                            const scan = s.scans.find(sc => sc.imageUrl === url);
                            if (scan) return scan.date;
                        }
                    }
                    return null;
                };

                const dateLeft = findScanDate(comparison.left.image) || new Date().toLocaleDateString();
                const dateRight = findScanDate(comparison.right.image) || new Date().toLocaleDateString();

                doc.text(`PRE-OP: ${dateLeft}`, pageWidth - 15, 32, { align: 'right' });
                doc.text(`POST-OP: ${dateRight}`, pageWidth - 15, 38, { align: 'right' });
            } else {
                const surgeryDate = activePatient?.visits?.[0]?.surgeryDate || "TBD";
                doc.text(`SURGERY DATE: ${surgeryDate}`, pageWidth - 15, 32, { align: 'right' });
            }

            // --- CLINICAL CASE OVERVIEW ---
            let yPos = 55;
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("CLINICAL CASE OVERVIEW", 15, yPos);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, yPos + 3, pageWidth - 15, yPos + 3);

            yPos += 12;
            const col1 = 15;
            const col2 = pageWidth / 2 + 5;

            // PATIENT SECTION
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("PATIENT", col1, yPos);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            yPos += 7;
            doc.text(`Name: ${activePatient?.name || "N/A"}`, col1, yPos);
            yPos += 5;
            doc.text(`Age/Sex: ${activePatient?.age || "N/A"} / ${activePatient?.gender || "-"}`, col1, yPos);
            yPos += 5;
            doc.text(`ID: ${activePatient?.id || "N/A"}`, col1, yPos);
            yPos += 5;
            doc.text(`DOB: ${activePatient?.dob || "N/A"}`, col1, yPos);
            yPos += 8;
            doc.text(`Visit No: ${activePatient?.visits?.length || "1"}`, col1, yPos);
            yPos += 5;
            doc.text(`Diagnosis: ${activePatient?.visits?.[0]?.diagnosis || "N/A"}`, col1, yPos);

            // SURGEON SECTION
            let surgeY = yPos - 35;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("SURGICAL TEAM", col2, surgeY);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            surgeY += 7;
            doc.text(`Surgeon: ${user?.name || "Dr. User"}`, col2, surgeY);
            surgeY += 5;
            doc.text(`Title: ${user?.title || "Chief Surgical Consultant"}`, col2, surgeY);
            surgeY += 5;
            doc.text(`Dept: ${user?.subsection || "Lumbar"}`, col2, surgeY);
            surgeY += 8;
            doc.text(`Plan Date: ${new Date().toLocaleDateString()}`, col2, surgeY);
            surgeY += 5;
            doc.text(`Surgery Date: ${activePatient?.visits?.[0]?.surgeryDate || "TBD"}`, col2, surgeY);

            yPos += 15;

            // --- PLANNING IMAGES ---
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(11);
            doc.text("PLANNING DOCUMENTATION", 15, yPos);
            yPos += 6;

            const allCanvases = Array.from(document.querySelectorAll('canvas'))
                .filter(c => c.width > 300);

            if (isComparisonMode && allCanvases.length >= 2) {
                const margin = 15;
                const gap = 5;
                const imgWidth = (pageWidth - (margin * 2) - gap) / 2;
                const cLeft = allCanvases.find(c => c.getAttribute('data-side') === 'left') || allCanvases[0];
                const cRight = allCanvases.find(c => c.getAttribute('data-side') === 'right') || allCanvases[1];

                if (cLeft && cRight) {
                    const data1 = cLeft.toDataURL('image/png', 0.8);
                    const data2 = cRight.toDataURL('image/png', 0.8);
                    const h1 = imgWidth * (cLeft.height / cLeft.width);
                    if (yPos + h1 > pageHeight - 30) { doc.addPage(); yPos = 20; }
                    doc.addImage(data1, 'PNG', margin, yPos, imgWidth, h1);
                    doc.addImage(data2, 'PNG', margin + imgWidth + gap, yPos, imgWidth, h1);
                    yPos += h1 + 15;
                }
            } else if (allCanvases.length >= 3) {
                const margin = 15;
                const gap = 4;
                const imgWidth = (pageWidth - (margin * 2) - gap) / 2;
                const h = imgWidth * 0.75;
                if (yPos + (h * 2) > pageHeight - 30) { doc.addPage(); yPos = 20; }
                allCanvases.slice(0, 4).forEach((c, idx) => {
                    const row = Math.floor(idx / 2);
                    const col = idx % 2;
                    doc.addImage(c.toDataURL('image/png', 0.8), 'PNG', margin + col * (imgWidth + gap), yPos + row * (h + gap), imgWidth, h);
                });
                yPos += (h * 2) + gap + 15;
            } else if (allCanvases.length > 0) {
                const c = allCanvases[0];
                const imgWidth = pageWidth - 30;
                const imgHeight = imgWidth * (c.height / c.width);
                if (yPos + imgHeight > pageHeight - 40) { doc.addPage(); yPos = 20; }
                doc.addImage(c.toDataURL('image/png', 0.9), 'PNG', 15, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 15;
            }

            // --- MEASUREMENT DATA TABLE ---
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(11);
            if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
            doc.text("MEASUREMENT DATA", 15, yPos);
            yPos += 5;

            const tableRows = selectedMeasurements.map((m, idx) => {
                let displayResult = m.result;
                if (typeof displayResult === 'number') displayResult = displayResult.toFixed(1);

                const level = (m as any).level || (m as any).measurement?.level || "—";
                const comments = (m as any).comments || (m as any).measurement?.comments || "";
                const levelAndComments = comments ? `${level} (${comments})` : level;

                return [
                    idx + 1,
                    (m.toolKey || "Unknown").toUpperCase(),
                    levelAndComments,
                    displayResult || "N/A"
                ];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['#', 'Metric', 'Level / Comments', 'Clinical Value']],
                body: tableRows,
                theme: 'striped',
                styles: { fontSize: 8, cellPadding: 4, textColor: 50, lineColor: 240, lineWidth: 0.1 },
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 2: { cellWidth: 50 } },
                margin: { left: 15, right: 15 },
                didDrawPage: (data) => {
                    yPos = data.cursor?.y || yPos;
                }
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.text("Generated by Spinesurge", 15, pageHeight - 10);
            }

            const fileName = `Spinesurge_Report_${(activePatient?.name || 'Scan').replace(/[^a-z0-9]/gi, '_')}.pdf`;

            if (window.spinesurge) {
                // Electron-native save handling
                const savePath = await window.spinesurge.selectSaveLocation(fileName, [
                    { name: 'PDF Document', extensions: ['pdf'] }
                ]);

                if (savePath) {
                    const pdfData = doc.output('arraybuffer');
                    await window.spinesurge.writeFile(savePath, pdfData);
                    console.log(`Report successfully saved to: ${savePath}`);
                }
            } else {
                // Standard browser download
                doc.save(fileName);
            }

            if (saveToRecord && activePatient) {
                const { currentImage } = useAppStore.getState();
                let targetVisit = null;
                if (currentImage) {
                    const targetStudy = activePatient.studies.find(s =>
                        s.scans.some(scan => scan.imageUrl === currentImage)
                    );
                    if (targetStudy) {
                        targetVisit = activePatient.visits.find(v => v.id === targetStudy.id) || activePatient.visits[0];
                    }
                }
                if (!targetVisit && activePatient.visits.length > 0) {
                    targetVisit = activePatient.visits[0];
                }
                if (targetVisit) {
                    const blob = doc.output('blob');
                    await api.uploadReport(targetVisit.id, blob, `Report - ${new Date().toLocaleDateString()}`);
                }
            }

            onOpenChange(false);
        } catch (err: any) {
            console.error("PDF Export Critical Failure:", err);
            alert(`Export failed: ${err.message || "Unknown error"}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Generate PDF Report
                    </DialogTitle>
                    <DialogDescription>
                        You have <strong>{checkedCount}</strong> measurements ready for clinical documentation.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Report Ready
                        </div>
                        <ul className="text-[11px] space-y-1.5 text-muted-foreground">
                            <li>• Professional Radiology Template (A4)</li>
                            <li>• Patient: {activePatient?.name || "Unassigned"}</li>
                            <li>• Surgeon: {user?.name}</li>
                            <li>• Measured Parameters: {checkedCount} tool(s)</li>
                        </ul>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="saveToRecord"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-900 dark:border-slate-700"
                            checked={saveToRecord}
                            onChange={(e) => setSaveToRecord(e.target.checked)}
                        />
                        <label
                            htmlFor="saveToRecord"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Save to Patient Record
                        </label>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleExportPDF}
                        disabled={isGenerating || checkedCount === 0}
                        className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-900/20 font-bold"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                {saveToRecord ? "Save & Download" : "Download PDF"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
