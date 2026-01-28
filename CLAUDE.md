# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # TypeScript check + production build (output: dist/)
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

Binder Print is a React web app for generating duplex-ready PDFs with cutting outlines for binder holes. Users upload PDFs/images and the app generates printable output where one side has content and the back side has hole outlines for cutting machines.

### Core Data Flow

1. **File Upload** → `contentProcessor.ts` converts PDFs/images to `ContentPage` objects with base64 data URLs
2. **Position Editor** → Users can drag/scale content within the printable area
3. **PDF Generation** → `pdfGenerator.ts` creates alternating content + outline pages for duplex printing

### Key Services (`src/services/`)

- **binderSpecs.ts**: Hole specifications for each binder type (positions, diameters, edge distances). The `getHolePositions()` function calculates Y coordinates for holes based on page height.
- **pdfGenerator.ts**: Main PDF generation. Handles single-page and 2-up modes (two A5 pages on one A4 sheet). Uses pdf-lib for PDF creation.
- **outlineGenerator.ts**: Draws mirrored cutting outlines (holes + trim lines + crop marks) on the back of content pages.
- **contentProcessor.ts**: Uses pdfjs-dist to render PDF pages to canvas, converts to data URLs for embedding.

### Binder Types Supported

| Type | Holes | Pitch | Standard |
|------|-------|-------|----------|
| a5-20-hole | 20 | 9.7mm | Japanese |
| a5-2-hole | 2 | 80mm gap | ISO 838 |
| a5-6-hole-filofax | 6 | 19mm + 50.8mm gap | Filofax |
| a5-6-hole-standard | 6 | 19mm + 70mm gap | Generic |
| a4-4-hole | 4 | 80mm between | European |

### Type Definitions (`src/types/index.ts`)

- `ContentPage`: Represents uploaded content with position/scale info
- `BinderSpec`: Hole specifications including `getHolePositions()` function
- `GeneratePdfOptions`: Options passed to PDF generator

### Unit Conversions

PDF uses points (72 points = 1 inch). The codebase uses mm internally:
- `mmToPoints(mm)`: Convert mm to PDF points
- `pxToMm(px, dpi)`: Convert pixels to mm (assumes 150 DPI for content)
