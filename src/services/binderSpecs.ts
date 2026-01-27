import type { BinderSpec, BinderType } from '../types';
import { PAPER_SIZES } from '../types';

// Hole diameter constant (6mm as specified)
const HOLE_DIAMETER = 6;

// A5 20-hole (Japanese standard)
// Hole pitch: ~9.7mm, holes centered on the long edge
const a5_20_hole: BinderSpec = {
  id: 'a5-20-hole',
  name: 'A5 20-Hole (Japanese)',
  paperSize: 'A5',
  holeCount: 20,
  holeDiameter: HOLE_DIAMETER,
  edgeDistance: 5.5, // ~5.5mm from edge
  getHolePositions: (pageHeight: number) => {
    const pitch = 9.7; // mm between holes
    const totalSpan = pitch * 19; // 19 gaps for 20 holes
    const startY = (pageHeight - totalSpan) / 2;
    return Array.from({ length: 20 }, (_, i) => startY + i * pitch);
  },
};

// A5 2-hole (ISO 838)
// 80mm spacing between holes, centered on page
const a5_2_hole: BinderSpec = {
  id: 'a5-2-hole',
  name: 'A5 2-Hole (ISO 838)',
  paperSize: 'A5',
  holeCount: 2,
  holeDiameter: HOLE_DIAMETER,
  edgeDistance: 12, // 12mm from edge (ISO 838)
  getHolePositions: (pageHeight: number) => {
    const spacing = 80; // mm between holes
    const centerY = pageHeight / 2;
    return [centerY - spacing / 2, centerY + spacing / 2];
  },
};

// A5 6-hole Filofax style
// 19mm pitch within groups, 50.8mm central gap
const a5_6_hole_filofax: BinderSpec = {
  id: 'a5-6-hole-filofax',
  name: 'A5 6-Hole (Filofax)',
  paperSize: 'A5',
  holeCount: 6,
  holeDiameter: HOLE_DIAMETER,
  edgeDistance: 12,
  getHolePositions: (pageHeight: number) => {
    const pitch = 19; // mm between holes in same group
    const centralGap = 50.8; // mm between the two groups
    const centerY = pageHeight / 2;

    // Top group (3 holes)
    const topGroupCenter = centerY - centralGap / 2 - pitch;
    // Bottom group (3 holes)
    const bottomGroupCenter = centerY + centralGap / 2 + pitch;

    return [
      topGroupCenter - pitch,
      topGroupCenter,
      topGroupCenter + pitch,
      bottomGroupCenter - pitch,
      bottomGroupCenter,
      bottomGroupCenter + pitch,
    ];
  },
};

// A5 6-hole Standard
// 19mm pitch within groups, 70mm central gap
const a5_6_hole_standard: BinderSpec = {
  id: 'a5-6-hole-standard',
  name: 'A5 6-Hole (Standard)',
  paperSize: 'A5',
  holeCount: 6,
  holeDiameter: HOLE_DIAMETER,
  edgeDistance: 12,
  getHolePositions: (pageHeight: number) => {
    const pitch = 19; // mm between holes in same group
    const centralGap = 70; // mm between the two groups
    const centerY = pageHeight / 2;

    // Top group (3 holes)
    const topGroupCenter = centerY - centralGap / 2 - pitch;
    // Bottom group (3 holes)
    const bottomGroupCenter = centerY + centralGap / 2 + pitch;

    return [
      topGroupCenter - pitch,
      topGroupCenter,
      topGroupCenter + pitch,
      bottomGroupCenter - pitch,
      bottomGroupCenter,
      bottomGroupCenter + pitch,
    ];
  },
};

// A4 4-hole (European standard)
// 80mm spacing between each hole
const a4_4_hole: BinderSpec = {
  id: 'a4-4-hole',
  name: 'A4 4-Hole (European)',
  paperSize: 'A4',
  holeCount: 4,
  holeDiameter: HOLE_DIAMETER,
  edgeDistance: 11, // 11mm from edge
  getHolePositions: (pageHeight: number) => {
    const spacing = 80; // mm between adjacent holes
    const totalSpan = spacing * 3; // 3 gaps for 4 holes
    const startY = (pageHeight - totalSpan) / 2;
    return Array.from({ length: 4 }, (_, i) => startY + i * spacing);
  },
};

export const BINDER_SPECS: Record<BinderType, BinderSpec> = {
  'a5-20-hole': a5_20_hole,
  'a5-2-hole': a5_2_hole,
  'a5-6-hole-filofax': a5_6_hole_filofax,
  'a5-6-hole-standard': a5_6_hole_standard,
  'a4-4-hole': a4_4_hole,
};

export const getBinderSpec = (type: BinderType): BinderSpec => {
  return BINDER_SPECS[type];
};

// Get the target content area size based on binder type and whether it's being printed on A4 or A5
export const getContentArea = (
  binderType: BinderType,
  paperSize: 'A4' | 'A5',
  pageSide: 'left' | 'right',
  enablePadding: boolean
): { width: number; height: number; offsetX: number; offsetY: number } => {
  const spec = BINDER_SPECS[binderType];
  const paper = PAPER_SIZES[paperSize];
  const binderPaper = PAPER_SIZES[spec.paperSize];

  const padding = enablePadding ? 5 : 0; // 5mm padding from holes
  const holeMargin = spec.edgeDistance + spec.holeDiameter / 2 + padding;

  // Content width is reduced by the hole margin
  const contentWidth = binderPaper.width - holeMargin;
  const contentHeight = binderPaper.height;

  // Calculate offset based on paper size and page side
  let offsetX: number;
  let offsetY: number;

  if (paperSize === spec.paperSize) {
    // Same paper size as binder
    offsetY = 0;
    if (pageSide === 'left') {
      // Holes on right, content on left
      offsetX = 0;
    } else {
      // Holes on left, content on right
      offsetX = holeMargin;
    }
  } else if (paperSize === 'A4' && spec.paperSize === 'A5') {
    // A5 binder on A4 paper - center the A5 area
    offsetX = (paper.width - binderPaper.width) / 2;
    offsetY = (paper.height - binderPaper.height) / 2;

    if (pageSide === 'right') {
      offsetX += holeMargin;
    }
  } else {
    // Default case
    offsetX = pageSide === 'right' ? holeMargin : 0;
    offsetY = 0;
  }

  return {
    width: contentWidth,
    height: contentHeight,
    offsetX,
    offsetY,
  };
};
