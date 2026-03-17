# Resection Tool Components Analysis

This document identifies all parts of the project repository that affect the resection tool under the planning suite.

## Core Implementation Files

### 1. Planning Tools Implementation
- **File**: `src/features/measurements/planning/PlanningTools.ts`
- **Function**: `drawResection()`
- **Purpose**: Main visualization logic for resection tool
- **Key Features**:
  - Handles 4-point input (A, B, C, D) for two cut lines
  - Calculates cut rays and transformation parameters
  - Renders dashed seam line visualization
  - Computes rotation angle and translation for fragment alignment
  - NO-OP deformed rendering (annotation only)

### 2. Surgical Operations Backend
- **File**: `src/lib/canvas/SurgicalOperations.ts`
- **Function**: `performResectionOnFragment()`
- **Purpose**: Executes actual resection operation on fragments
- **Key Features**:
  - Performs two sequential cuts using extrapolated lines
  - Identifies upper, middle, and lower fragments
  - Removes middle fragment (resected bone)
  - Applies rotation to upper fragment for closure
  - Returns operation results with fragment IDs

### 3. Canvas Manager Integration
- **File**: `src/lib/canvas/CanvasManager.ts`
- **Purpose**: Core state management and operation system
- **Integration Points**:
  - Fragment management and manipulation
  - Cut operation support
  - Delete fragment operation
  - Rotation operation
  - State history and undo/redo

## UI Integration Files

### 4. Canvas Workspace
- **File**: `src/features/canvas/CanvasWorkspace.tsx`
- **Integration Points**:
  - Imports `drawResection` and `performResectionOnFragment`
  - Handles resection tool preview during point placement
  - Executes resection operation on completion (4 points)
  - Renders resection annotations on measurements
  - Manages fragment clipping and visual boundaries

### 5. Left Sidebar Navigation
- **File**: `src/features/navigation/LeftSidebar.tsx`
- **Integration**: Tool definition in Osteotomy section
- **Display**: `{ id: 'ost-resect', label: 'Resect', fullName: 'Resection Plan' }`

### 6. Tool Constants
- **File**: `src/features/navigation/toolConstants.ts`
- **Integration**: Categorizes resection in "Planning Suite"
- **Array**: `["ost-pso", "ost-spo", "ost-resect", "ost-open", ...]`

### 7. Measurement System Router
- **File**: `src/features/measurements/MeasurementSystem.ts`
- **Integration**: Routes 'ost-resect' tool to `drawResection()`
- **Switch Case**: Handles resection tool rendering dispatch

## State Management Files

### 8. Canvas State Slice
- **File**: `src/lib/store/canvasSlice.ts`
- **Purpose**: Redux state management for canvas operations
- **Integration**: Manages canvas state including measurements and fragments

### 9. Store Index
- **File**: `src/lib/store/index.ts`
- **Purpose**: Combines all state slices including canvas slice
- **Integration**: Provides unified app state including resection tool state

### 10. Type Definitions
- **File**: `src/lib/store/types.ts`
- **Purpose**: Imports and re-exports Measurement type from CanvasManager
- **Integration**: Ensures type consistency across the application

## Supporting Utility Files

### 11. Geometry Utilities
- **File**: `src/lib/canvas/GeometryUtils.ts`
- **Functions Used**:
  - `getPolygonCenter()` - Fragment center calculation
  - `extrapolateLine()` - Cut line extension
  - Point manipulation utilities

### 12. Canvas Utilities
- **File**: `src/lib/canvas/CanvasUtils.ts`
- **Functions Used**:
  - `drawMeasurementLabel()` - Resection label rendering

## Test Files

### 13. Test Coverage
- **Current Status**: No specific resection tool tests found
- **Related Tests**: 
  - `src/lib/canvas/OpenOsteotomyOperation.test.ts` (similar surgical operation)
  - `src/lib/canvas/OpenOsteotomyOperation.integration.test.ts` (integration patterns)

## Data Flow Summary

1. **User Interaction**: User selects resection tool from LeftSidebar
2. **Point Collection**: CanvasWorkspace collects 4 points (A,B,C,D)
3. **Preview Rendering**: PlanningTools.drawResection() shows preview
4. **Operation Execution**: SurgicalOperations.performResectionOnFragment() executes
5. **State Management**: CanvasManager handles fragment operations
6. **UI Update**: CanvasWorkspace re-renders with updated fragments

## Key Dependencies

- **Fragment System**: Relies on CanvasManager fragment operations
- **Geometry Engine**: Uses GeometryUtils for calculations
- **State Management**: Integrates with Redux store via canvasSlice
- **Measurement System**: Part of the broader measurement framework
- **Planning Suite**: Grouped with other osteotomy tools (PSO, SPO, Open)

## Architecture Notes

- **Annotation-Only**: Resection tool is annotation-only (no pixel movement)
- **Fragment-Based**: Operations work on fragment geometry, not image pixels
- **Two-Phase**: Separate preview (drawing) and execution (operation) phases
- **State-Driven**: All changes go through CanvasManager state system
- **Modular Design**: Clear separation between UI, operations, and utilities