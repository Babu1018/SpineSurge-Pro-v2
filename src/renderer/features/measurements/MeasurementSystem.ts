import { Measurement } from "@/lib/canvas/CanvasManager";
import { Point } from "@/lib/canvas/GeometryUtils";
import { drawMeasurementLabel } from "@/lib/canvas/CanvasUtils";
import { drawCobbAngle } from "./quick/CobbAngle";
import { drawSVA } from "./quick/SVA";
import { drawVBM } from "./quick/VBM";
import { drawSpinalCurvature } from "./quick/SpinalCurvatures";
import { drawPelvicParameters } from "./quick/PelvicParams";
import { drawPILL } from "./quick/PI_LL";
import { drawStenosis } from "./pathology/Stenosis";
import { drawSpondylolisthesis } from "./pathology/Spondylolisthesis";
import { drawPO, drawC7PL, drawCSVL, drawTS, drawAVT, drawSlope, drawCMC, drawTPA, drawSPA, drawSSA, drawSPi, drawCBVA, drawRVAD, drawITilt } from "./deformity/DeformityTools";
import { drawWedgeOsteotomy, drawResection } from "./planning/PlanningTools";

import { drawPencil, drawText, drawCircle, drawEllipse, drawPolygon } from "./utilities/UtilitiesTools";

export const MeasurementSystem = {
    draw: (ctx: CanvasRenderingContext2D, m: Measurement, k: number, ratio: number | null, bounds?: { minY: number, maxY: number }) => {
        switch (m.toolKey) {
            case 'cobb':
            case 'angle-4pt': // Added mapping
                drawCobbAngle(ctx, m, k);
                break;
            case 'pencil':
                drawPencil(ctx, m, k, ratio);
                break;
            case 'text':
                drawText(ctx, m, k);
                break;
            case 'circle':
                drawCircle(ctx, m, k, ratio);
                break;
            case 'ellipse':
                drawEllipse(ctx, m, k, ratio);
                break;
            case 'polygon':
                drawPolygon(ctx, m, k, ratio);
                break;
            case 'sva':
                drawSVA(ctx, m, k, ratio);
                break;
            case 'vbm':
                drawVBM(ctx, m, k, ratio);
                break;
            case 'cl':
                drawSpinalCurvature(ctx, m, k, 'CL');
                break;
            case 'tk':
                drawSpinalCurvature(ctx, m, k, 'TK');
                break;
            case 'll':
                drawSpinalCurvature(ctx, m, k, 'LL');
                break;
            case 'sc':
                drawSpinalCurvature(ctx, m, k, 'Angle');
                break;
            case 'pelvis':
                drawPelvicParameters(ctx, m, k);
                break;
            case 'pi_ll':
                drawPILL(ctx, m, k);
                break;
            case 'stenosis':
                drawStenosis(ctx, m, k, ratio);
                break;
            case 'spondy':
                drawSpondylolisthesis(ctx, m, k, ratio);
                break;
            case 'po':
                drawPO(ctx, m, k);
                break;
            case 'c7pl':
                drawC7PL(ctx, m, k, '#3b82f6', bounds);
                break;
            case 'csvl':
                drawCSVL(ctx, m, k, '#f59e0b', bounds);
                break;
            case 'ts':
                drawTS(ctx, m, k, ratio, '#ef4444', bounds);
                break;
            case 'avt':
                drawAVT(ctx, m, k, ratio, '#a855f7', bounds);
                break;
            case 'slope':
                drawSlope(ctx, m, k);
                break;
            case 'cmc':
                drawCMC(ctx, m, k);
                break;
            case 'tpa':
                drawTPA(ctx, m, k);
                break;
            case 'spa':
                drawSPA(ctx, m, k);
                break;
            case 'ssa':
                drawSSA(ctx, m, k);
                break;
            case 't1spi':
            case 't9spi':
            case 'odha':
                drawSPi(ctx, m, k, '#0ea5e9', bounds);
                break;
            case 'cbva':
                drawCBVA(ctx, m, k, '#f97316', bounds);
                break;
            case 'rvad':
                drawRVAD(ctx, m, k);
                break;
            case 'itilt':
                drawITilt(ctx, m, k);
                break;
            case 'ost-pso':
            case 'ost-spo':
            case 'ost-open':
                drawWedgeOsteotomy(ctx, m, k);
                break;
            case 'ost-resect':
                drawResection(ctx, m, k);
                break;
            default:
                // Fallback for simple point/line
                ctx.save();
                const color = m.toolKey === 'line' ? '#3b82f6' : '#00e5ff';
                ctx.strokeStyle = color;
                ctx.fillStyle = '#ffffff';
                ctx.lineWidth = 2 / k;

                if (m.points.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(m.points[0].x, m.points[0].y);
                    for (let i = 1; i < m.points.length; i++) {
                        ctx.lineTo(m.points[i].x, m.points[i].y);
                    }
                    ctx.stroke();
                }

                m.points.forEach((p: Point) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4 / k, 0, Math.PI * 2);
                    ctx.fill();
                });

                if (m.result && m.points.length >= 1) {
                    const labelPos = m.measurement?.labelPos || (m.points.length >= 2
                        ? { x: (m.points[0].x + m.points[1].x) / 2, y: (m.points[0].y + m.points[1].y) / 2 }
                        : { x: m.points[0].x + 20 / k, y: m.points[0].y - 20 / k });

                    drawMeasurementLabel(ctx, m.result, labelPos, k);
                }
                ctx.restore();
                break;
        }
    }
};
