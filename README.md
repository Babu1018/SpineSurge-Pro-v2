# 🦴 SpineSurge-Pro — Full Architecture, Workflow & Feature Guide

> **README for Developers, Researchers & Clinical Meeting Presentations**
> Covers the full tech stack, directory structure, DICOM-to-screw workflow, and a plain-English walkthrough of all four key interactive features.

---

## Table of Contents

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Directory Structure & Responsibilities](#2-directory-structure--responsibilities)
3. [The Core Concept: State-Driven Architecture](#3-the-core-concept-state-driven-architecture)
4. [Main Workflow: DICOM Loading & Screw Placement](#4-main-workflow-dicom-loading--screw-placement)
5. [Feature Walkthrough for Meeting](#5-feature-walkthrough-for-meeting)
   - [Feature 01 — Real DICOM Upload](#feature-01--real-dicom-upload)
   - [Feature 02 — Manual ROI Crop Directly on 2D Images](#feature-02--manual-roi-crop-directly-on-2d-images)
   - [Feature 03 — Screw Visible in All 3 2D Planes Simultaneously](#feature-03--screw-visible-in-all-3-2d-planes-simultaneously)
   - [Feature 04 — Drag to Fine-Tune Screw Position on 2D Views](#feature-04--drag-to-fine-tune-screw-position-on-2d-views)
6. [Summary Table](#6-summary-table)

---

## 1. Tech Stack Overview

| Layer | Technology |
|---|---|
| Web Framework | React 19, TypeScript, Vite |
| Desktop Wrapper | Electron (via electron-vite) |
| Styling | Tailwind CSS, Radix UI Primitives |
| Global State | Zustand — modular slices (`dicomSlice`, `patientSlice`) |
| Medical Imaging (2D/3D) | Cornerstone3D (`@cornerstonejs/core`, `tools`, `dicom-image-loader`, `streaming-image-volume-loader`) |
| Volumetric Rendering | VTK.js (`@kitware/vtk.js`) |
| Collaboration & Sync | Yjs + y-websocket (real-time multi-user updates) |
| Local Backend / PACS | Node.js, SQLite, Drizzle ORM (inside `server/`) |

---

## 2. Directory Structure & Responsibilities

```
SpineSurge-Pro/
├── src/main/           # Electron core — GPU flags, IPC handlers, OS file dialogs
├── src/preload/        # Secure bridge between Electron and React renderer
├── src/renderer/       # Desktop React frontend
│   ├── features/
│   │   ├── dicom/              # CornerstoneViewer.tsx — 2D/3D viewports
│   │   ├── screw-placement/    # Sidebar UI, screw config, VTK renderer
│   │   ├── measurements/       # Grading logic, bone contact analysis
│   │   └── canvas/             # 2D overlay engine, SVG intersection drawing
│   └── lib/store/
│       └── dicomSlice.ts       # Zustand state: dicomSeries, threeDImplants, interactionMode
├── src-web/            # Browser-only version — HTML5 drag-drop instead of IPC
└── server/             # SQLite PACS emulator, auth, case persistence (Drizzle ORM)
```

### Folder responsibilities at a glance

- **`src/main/`** — Hosts the Electron main process. Sets up strict WebGL and GPU hardware acceleration flags critical for Cornerstone3D and VTK performance. Exposes secure IPC handlers for native OS folder dialogs, letting the app read local DICOM datasets without browser memory restrictions.
- **`src/preload/`** — Preload scripts securely translate `src/main` APIs into the browser window context without exposing full Node.js APIs to the React frontend.
- **`src/renderer/`** — The entire desktop web application runs here. Domain-driven feature folders handle every major concern: DICOM loading, screw placement, measurement, and canvas overlay.
- **`src-web/`** — A parallel entry point to `src/renderer/` compiled strictly for standard browsers. Replaces native IPC file loading with HTML5 drag-and-drop or server uploads via fetch.
- **`server/`** — A Node.js SQLite server using Drizzle ORM. Handles user authentication, persists medical context mapping, stores case plans, and acts as an interim PACS emulator for the web version.

---

## 3. The Core Concept: State-Driven Architecture

SpineSurge-Pro is built as a **State-Driven Application** using the Zustand global store as the single source of truth across all four viewports.

```
User Action
    │
    ▼
Zustand Store Update  ─────────────────────────────────────┐
    │                                                       │
    ▼                                                       ▼
CornerstoneViewer (2D Axial/Sagittal/Coronal)        VTK 3D Viewport
renders slice overlays                               renders bone + screws
```

**State flow summary:**

1. `dicomSeries` → set by the DICOM loader, consumed by `CornerstoneViewer` and `MainPage`
2. `isDicomMode` → triggers `MainPage` routing to mount the viewer
3. `roiRanges` (LR/PA/IS) → set by ROI sliders or drag handles, consumed by both 2D crop and 3D clipping planes
4. `interactionMode` → set by the toolbar (`place_screw`, `navigate`, etc.), consumed by the click handler
5. `threeDImplants[]` → set by `addThreeDImplant()`, consumed by the VTK renderer and the 2D overlay engine
6. `implantProperties` → set by the sidebar controls, consumed by the VTK mapper and grading module

---

## 4. Main Workflow: DICOM Loading & Screw Placement

### Step 1 — Initialise the Volume (DICOM Loader)

Upon receiving the DICOM frames, the system sorts them by slice location (Z-axis) and bundles them into a memory volume that VTK can mathematically manipulate.

```typescript
// Initialise the 3D Volume from the selected DICOM frames
const sortedImageIds = await cornerstoneLoader.loadImages(fileList);
const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds: sortedImageIds,
    dataType: 'Uint16Array' // Derived from the DICOM header
});
volume.load();

// Bind four viewports
renderingEngine.setViewports([
    { viewportId: 'AXIAL',    type: ViewportType.ORTHOGRAPHIC },
    { viewportId: 'SAGITTAL', type: ViewportType.ORTHOGRAPHIC },
    { viewportId: 'CORONAL',  type: ViewportType.ORTHOGRAPHIC },
    { viewportId: 'THREED',   type: ViewportType.VOLUME_3D    }
]);
```

### Step 2 — 2D Pixel Click → 3D World Space (Screw Placement Logic)

When the user enters `place_screw` mode, Cornerstone viewports intercept mouse clicks and translate canvas coordinates to real patient-space millimetres.

```typescript
// Inside CornerstoneViewer.tsx — click handler
const handleStandardClick = (evt: MouseEvent) => {
    // 1. Get exact canvas coordinates
    const canvasPos = [evt.clientX - rect.left, evt.clientY - rect.top];

    // 2. Translate to 3D world space
    const worldPos = viewport.canvasToWorld(canvasPos);
    // worldPos → [X mm, Y mm, Z mm] — absolute patient coordinates

    // 3. Inject the implant into global state
    if (interactionMode === 'place_screw') {
        const newScrew = {
            id: `screw-${Date.now()}`,
            type: 'screw',
            position: [worldPos[0], worldPos[1], worldPos[2]],
            direction: [0, 0, 1], // Initial Z-forward trajectory
            properties: {
                diameter: 6.25,
                length: 40,
                color: '#22d3ee',
                modelPath: `/models/screws/scaled_625x40.vtk`
            }
        };
        useAppStore.getState().addThreeDImplant(newScrew);
    }
};
```

### Step 3 — Hardware Visual Feedback (Renderer Cycle)

Because the store is the single source of truth across all four viewports, one new screw triggers visual updates everywhere:

- **3D Action** — A dynamic VTK mapper pulls the matching `.vtk` hardware mesh from public assets. It applies a math translation matrix placing the VTK object at the `position` vector and aligns it along the `direction` vector inside the 3D gold bone viewport.
- **2D Action** — An `IMAGE_RENDERED` Cornerstone event fires on every slice scroll. It loops over the global `threeDImplants` array, calculates whether the current slice plane bisects any part of the 3D screw cylinder (accounting for radius/diameter), and if so, draws an HTML5 Canvas SVG overlay on top of the 2D medical image to show the trajectory.

---

## 5. Feature Walkthrough for Meeting

> The four sections below explain each major interactive feature in plain English — written for clinical or non-technical audiences. No code knowledge required.

### What is SpineSurge-Pro?

SpineSurge-Pro is a browser-based surgical planning simulator that replicates the full 3D Slicer Pedicle Screw Simulator workflow used in spine surgery research and training. It is built entirely in React and Canvas — no server, no plugin, no installation required. A surgeon or researcher opens it in a browser, loads their CT data, and walks through the complete screw planning process from raw DICOM files to graded bone contact analysis.

**The five-step workflow:**

| Step | Name | What Happens |
|---|---|---|
| 1 | Load DICOM | Upload real CT files or use the built-in demo spine |
| 2 | Crop ROI | Define the vertebral segment by cropping the 3D volume |
| 3 | Place Points | Click the 3D bone model to mark screw insertion points |
| 4 | Place Screws | Load 3D screws, adjust angle and depth, verify in all 2D planes |
| 5 | Grade | Calculate bone contact percentage and evaluate placement quality |

---

### Feature 01 — Real DICOM Upload

**What it is:**
The application accepts real DICOM files — the same `.dcm` or `.IMA` files that come directly off a CT scanner or from a hospital PACS system. When you drop them onto the upload zone, the app reads, parses, and displays your patient's actual CT anatomy inside the four-panel viewer. No conversion step, no external software, no server upload is required.

**What happens when you drop files — step by step:**

1. **File selection** — You drag one or more DICOM files or an entire series folder onto the drop zone, or click it to browse. Each file represents one CT slice.
2. **Sort by name** — Files are sorted alphanumerically so the slice stack runs from the top of the spine (Superior) down to the bottom (Inferior), matching anatomical orientation.
3. **DICOM validation** — Each file is checked for the four-letter DICOM signature at byte position 128. Any file that fails this check is skipped silently — the workflow never breaks.
4. **Header reading** — The parser walks through the DICOM metadata tags to extract image dimensions (rows and columns), bit depth (usually 16-bit for CT), and the location of the pixel data block.
5. **Pixel extraction** — Raw pixel values are read from the pixel data block. CT values are stored as signed 16-bit integers representing Hounsfield Units — a density scale where air is −1000 HU and dense bone is around +1000 HU or higher.
6. **Hounsfield normalisation** — HU values are converted to a standard 0–255 brightness scale for display. This is what makes bone appear bright white, soft tissue mid-gray, and air black — exactly as in any CT viewer.
7. **Downsampling** — Each slice is resampled to a 64×64 working resolution. This keeps rendering fast and responsive while preserving all anatomical structure needed for planning.
8. **Volume assembly and reslice** — All valid slices are stacked into a 3D data volume in memory. The volume is then resliced automatically in two additional directions to produce the Sagittal (side view) and Coronal (front view) planes — no extra steps for the user.
9. **Fallback** — If fewer than three valid DICOM slices are found — due to corrupt files, wrong format, or no files at all — the app silently loads a built-in synthetic spine CT instead. The interface behaves identically. The status bar shows a green **DICOM loaded ✓** confirmation when real data was successfully parsed.

> 💡 **What the user sees:** After dropping files a brief loading indicator appears. Then all four panels populate — Axial top-left, 3D model top-right, Sagittal bottom-left, Coronal bottom-right. If the files are valid DICOM, real patient anatomy appears. If not, the synthetic spine loads automatically. Either way the workflow continues without interruption.

> 🏥 **Why this matters clinically:** You are working with the actual patient anatomy, not a generic model. Every screw placement decision is based on the real CT density, real bone geometry, and real pedicle dimensions for that specific patient. This is the same data standard used by surgical navigation systems and 3D Slicer in research environments.

---

### Feature 02 — Manual ROI Crop Directly on 2D Images

**What it is:**
After loading your DICOM data, Step 2 lets you define a Region of Interest — a 3D bounding box that isolates the specific vertebral segment you want to operate on. Instead of typing coordinates into a form, you draw and resize this box by dragging handles directly on the CT images themselves. Every change on any one panel is immediately reflected on all other panels and the 3D model.

**The pink bounding box:**
Each of the three 2D panels — Axial, Sagittal, and Coronal — displays a pink dashed rectangle overlaid on the CT image. This rectangle is your Region of Interest boundary as seen from that viewing angle. It has eight draggable control points around its perimeter.

**The eight drag handles — what each one does:**

| Handle | Position | What It Controls |
|---|---|---|
| Top-Left corner | Upper-left of box | Resizes Left and Top edges at once — shrinks or expands the box diagonally |
| Top-Right corner | Upper-right of box | Resizes Right and Top edges simultaneously |
| Bottom-Left corner | Lower-left of box | Resizes Left and Bottom edges simultaneously |
| Bottom-Right corner | Lower-right of box | Resizes Right and Bottom edges simultaneously |
| Top-Middle edge | Centre of the top edge | Moves only the Top boundary up or down — cuts off superior anatomy |
| Bottom-Middle edge | Centre of the bottom edge | Moves only the Bottom boundary up or down — cuts off inferior anatomy |
| Left-Middle edge | Centre of the left edge | Moves only the Left boundary left or right |
| Right-Middle edge | Centre of the right edge | Moves only the Right boundary left or right |
| Interior (move) | Anywhere inside the box | Translates the entire box without resizing — use when shape is correct but position is off |

**How synchronisation works:**
The Region of Interest is stored as six boundary values shared across the entire application — one minimum and one maximum for each of the three anatomical axes: Left-Right, Posterior-Anterior, and Inferior-Superior. Each 2D panel reads the appropriate pair of axis values to draw its rectangle:

- **Axial view (top-down)** — reads the Left-Right axis and the Posterior-Anterior axis
- **Sagittal view (side)** — reads the Left-Right axis and the Inferior-Superior axis
- **Coronal view (front)** — reads the Posterior-Anterior axis and the Inferior-Superior axis
- **3D clip box** — reads all six values to draw the pink wireframe cube in the 3D viewport

When you drag a handle on any panel, the app calculates how far the mouse moved and applies that delta to the relevant axis values. Because all four viewports share the same data object, they all update at the same moment — no lag, no apply button, no manual refresh.

**The sidebar sliders — fine-tune fallback:**
Six sliders appear in the left sidebar: L-R Min, L-R Max, P-A Min, P-A Max, I-S Min, I-S Max. They are always in sync with the drag handles. Moving a slider is functionally identical to dragging the corresponding handle. Sliders are useful when you need a precise value rather than a freehand drag.

> ⚠️ **Minimum box size protection:** A minimum of 5% of the volume is enforced in each axis direction. This prevents the bounding box from collapsing to zero. The constraint is applied automatically during dragging — you simply cannot drag a handle past the opposite edge.

> 🏥 **Why this matters clinically:** Isolating only the target vertebral level removes all irrelevant anatomy from the 3D view and reduces visual clutter in all panels. When planning screws at L4-L5 for example, you do not want the full lumbar and thoracic spine in the way. Tight cropping mirrors the standard 3D Slicer ROI workflow that surgeons and spine researchers already use as their normal planning process.

---

### Feature 03 — Screw Visible in All 3 2D Planes Simultaneously

**What it is:**
Once you load a screw in Step 4 and enable **Show screw in all 2D views**, the screw does not only appear on the 3D bone model. Its trajectory is simultaneously projected as an overlay onto all three 2D CT panels — Axial, Sagittal, and Coronal. This lets you verify the screw position against real bone anatomy from all three anatomical directions at the same time, without switching views.

**What you see on each plane:**

#### Axial View — Looking Straight Down the Spine

On the Axial view you see the spine as a horizontal cross-section — the same view you see when scrolling through CT slices on a radiology workstation. The screw overlay shows:

- A **filled circle** at the entry point representing the outer diameter of the screw — exactly how wide it appears when viewed from above
- A **dashed angled line** extending from the circle showing the medial or lateral tilt direction of the trajectory
- An **arrowhead** at the tip indicating direction of travel

This is the most critical view for detecting medial breach risk. If the trajectory line aims too far toward the centre of the spinal canal, it indicates a potentially dangerous medial malposition that could threaten the spinal cord or nerve roots.

#### Sagittal View — Looking From the Side

On the Sagittal view you see the spine in profile — vertebral bodies stacked with spinous processes projecting posteriorly. The screw overlay shows:

- A **dashed line** representing the full shaft length of the screw from entry point to tip
- An **arrowhead** at the tip showing depth direction
- The **entry circle** at the starting point on the pedicle surface

This is the most important view for judging screw depth. You can confirm the screw tip stays within the anterior cortex of the vertebral body and does not breach the anterior wall.

#### Coronal View — Looking From the Front

On the Coronal view you see the spine head-on with the spinous processes running down the centre and transverse processes spreading left and right. The screw overlay shows the medial-to-lateral trajectory and the superior-inferior angulation. This view is especially useful for confirming bilateral symmetry when screws are placed on both sides at the same level.

**All three views are live:**
Every time you move any slider — Rotate I-S to change the cranial or caudal tilt, Rotate L-R to change the medial or lateral angle, or Drive Screw to advance the screw along its trajectory — all three 2D overlays update at the same moment. You watch the trajectory change across all anatomical planes simultaneously.

> 🏥 **Why this matters clinically:** Reviewing a screw trajectory in only one plane is never sufficient for surgical planning. A trajectory that looks perfect on the sagittal view can still breach the pedicle medially when viewed axially, or breach the anterior cortex when examined coronally. Multi-planar review is the accepted standard of care in pedicle screw planning. This feature makes that review continuous and real-time rather than a separate verification step.

---

### Feature 04 — Drag to Fine-Tune Screw Position on 2D Views

**What it is:**
Beyond the angle and depth sliders in the sidebar, every placed screw can also be repositioned by directly dragging its entry point on any of the three 2D CT panels. The entry point appears as a filled cyan dot on the projected screw overlay. You grab that dot and drag it to a new position — the screw entry point moves, the trajectory line follows, and every other view updates immediately.

**Which axes each panel controls:**

| Panel | Drag Direction | Axes Moved | Effect on Screw |
|---|---|---|---|
| Axial (top-down) | Left or Right | Left-Right (X) | Moves entry point medially or laterally — toward or away from the spinous process |
| Axial (top-down) | Up or Down | Anterior-Posterior (Y) | Moves entry point anteriorly or posteriorly — toward the front or back of the vertebra |
| Sagittal (side) | Left or Right | Left-Right (X) | Slides the entry point along the length of the spine |
| Sagittal (side) | Up or Down | Inferior-Superior (Z) | Moves the entry point up or down within the vertebral level |
| Coronal (front) | Left or Right | Anterior-Posterior (Y) | Adjusts front-to-back position of the entry point |
| Coronal (front) | Up or Down | Inferior-Superior (Z) | Adjusts the height of the entry point within the level |

**The key principle — shared state:**
All three 2D panels and the 3D model read from the exact same screw position data object. When you drag the entry dot on any one panel, the position update is written back to shared state. All other panels immediately re-render with the new coordinates. There is no apply button, no confirmation, no delay. The update is continuous during the drag — you see all views responding as you move the mouse.

**Drag vs sliders — what is the difference?**

| Control Method | What It Changes | Best Used For |
|---|---|---|
| Rotate I-S slider | Cranial or caudal tilt angle of the trajectory | Fine-tuning the angle to match the endplate slope |
| Rotate L-R slider | Medial or lateral convergence angle | Adjusting how steeply the screw aims toward the vertebral midline |
| Drive Screw slider | How far along the trajectory the screw has been advanced | Simulating insertion depth — pushing in or pulling back |
| Drag on 2D panel | The physical entry point location on the bone surface | Repositioning where the screw starts on the pedicle |

In practice: **drag first** to place the entry point roughly in the correct anatomical position, then **use the Rotate sliders** to dial in the exact trajectory angle, then **Drive Screw** to advance it to the correct depth. Drag controls where the screw starts — sliders control how it travels.

> 💡 **Intuitive spatial interaction:** Surgeons think spatially. Being able to grab the screw visually on the actual CT image and pull it to the correct anatomical landmark — the pedicle isthmus, the superior facet junction, the transverse process base — is far more natural than adjusting abstract coordinate numbers. This drag interaction model directly mirrors the mental process surgeons use when planning screw entry points: looking at the anatomy and deciding where the entry should be relative to visible bone landmarks.

> 🏥 **Why this matters clinically:** Screw entry point selection is as important as trajectory angle. An incorrectly placed entry point will result in a malpositioned screw even if the angle is perfect. Having direct drag control over the entry point on the actual CT anatomy gives the planner the most accurate and intuitive way to position each screw relative to real patient bone landmarks.

---

## 6. Summary Table

| Feature | User Action | What Updates | Clinical Purpose |
|---|---|---|---|
| **Real DICOM Upload** | Drop `.dcm` or `.IMA` files onto the upload zone | All 4 panels load with real patient CT anatomy | Work with actual patient data, not a generic model |
| **Manual ROI Crop** | Drag any pink handle on Axial, Sagittal, or Coronal | All 3 panels and 3D clip box update simultaneously | Isolate the target vertebral segment before planning |
| **Screw in All 3 Planes** | Load screw and enable *Show screw in all 2D views* | Axial circle, Sagittal depth line, Coronal projection — all live | Multi-planar trajectory review — the clinical standard |
| **Drag Fine-Tune on 2D** | Drag the cyan entry dot on any 2D panel | Entry point repositions in all views and 3D model instantly | Intuitive landmark-based entry point selection |

---

> **SpineSurge-Pro is ready to demo.**
> Load the demo spine or drop any DICOM folder to begin the full five-step workflow.
