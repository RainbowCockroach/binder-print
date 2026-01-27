import type { PDFPage } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import type { BinderType, PageSide } from '../types';
import { PAPER_SIZES } from '../types';
import { BINDER_SPECS } from './binderSpecs';

// Convert mm to PDF points (1 inch = 72 points, 1 inch = 25.4 mm)
const mmToPoints = (mm: number): number => (mm / 25.4) * 72;

const LINE_WIDTH = 1; // 1pt line width

/**
 * Draw the cutting outline on a PDF page
 * This includes:
 * - Hole circles
 * - Page trim lines (full outline of the target page)
 *
 * The outline is mirrored because it's printed on the back of the content page
 */
export const drawOutline = (
  page: PDFPage,
  binderType: BinderType,
  paperSize: 'A4' | 'A5',
  pageSide: PageSide,
  is2Up: boolean = false,
  position: 'top' | 'bottom' | 'single' = 'single'
): void => {
  const spec = BINDER_SPECS[binderType];
  const paper = PAPER_SIZES[paperSize];
  const binderPaper = PAPER_SIZES[spec.paperSize];

  const pageWidth = mmToPoints(paper.width);
  const pageHeight = mmToPoints(paper.height);
  const targetWidth = mmToPoints(binderPaper.width);
  const targetHeight = mmToPoints(binderPaper.height);

  // Calculate position of the A5 area on the page
  let areaX: number;
  let areaY: number;

  if (is2Up && paperSize === 'A4' && spec.paperSize === 'A5') {
    // 2-up mode: A4 landscape with two A5 pages
    // For the outline (back side), we need to mirror horizontally
    if (position === 'top') {
      // Top position (when viewing from front, this is on the right)
      // Mirrored: this becomes left on the back
      areaX = 0;
      areaY = (pageWidth - targetHeight) / 2; // A4 is rotated, so width becomes height
    } else {
      // Bottom position
      areaX = targetWidth;
      areaY = (pageWidth - targetHeight) / 2;
    }
  } else {
    // Single page mode - center the target area
    areaX = (pageWidth - targetWidth) / 2;
    areaY = (pageHeight - targetHeight) / 2;

    // Mirror horizontally for duplex printing
    areaX = pageWidth - areaX - targetWidth;
  }

  // Draw trim lines (rectangle around the target area)
  page.drawRectangle({
    x: areaX,
    y: areaY,
    width: targetWidth,
    height: targetHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: LINE_WIDTH,
  });

  // Draw hole circles
  const holePositions = spec.getHolePositions(binderPaper.height);
  const holeDiameter = mmToPoints(spec.holeDiameter);
  const holeRadius = holeDiameter / 2;
  const edgeDistance = mmToPoints(spec.edgeDistance);

  // Calculate hole X position based on page side
  // Since we're on the back (mirrored), left page holes appear on left, right page holes appear on right
  let holeX: number;
  if (pageSide === 'left') {
    // Holes on right edge of content (left edge when mirrored)
    holeX = areaX + targetWidth - edgeDistance;
  } else {
    // Holes on left edge of content (right edge when mirrored)
    holeX = areaX + edgeDistance;
  }

  for (const posY of holePositions) {
    const holeY = areaY + mmToPoints(posY);

    page.drawCircle({
      x: holeX,
      y: holeY,
      size: holeRadius,
      borderColor: rgb(0, 0, 0),
      borderWidth: LINE_WIDTH,
    });
  }

  // Draw crop marks at corners (extending outside the trim area)
  const cropMarkLength = mmToPoints(5); // 5mm crop marks
  const cropMarkOffset = mmToPoints(3); // 3mm away from trim line

  const corners = [
    { x: areaX, y: areaY }, // bottom-left
    { x: areaX + targetWidth, y: areaY }, // bottom-right
    { x: areaX, y: areaY + targetHeight }, // top-left
    { x: areaX + targetWidth, y: areaY + targetHeight }, // top-right
  ];

  for (const corner of corners) {
    const isLeft = corner.x === areaX;
    const isBottom = corner.y === areaY;

    // Horizontal mark
    const hStart = isLeft ? corner.x - cropMarkOffset - cropMarkLength : corner.x + cropMarkOffset;
    const hEnd = isLeft ? corner.x - cropMarkOffset : corner.x + cropMarkOffset + cropMarkLength;

    page.drawLine({
      start: { x: hStart, y: corner.y },
      end: { x: hEnd, y: corner.y },
      color: rgb(0, 0, 0),
      thickness: LINE_WIDTH,
    });

    // Vertical mark
    const vStart = isBottom ? corner.y - cropMarkOffset - cropMarkLength : corner.y + cropMarkOffset;
    const vEnd = isBottom ? corner.y - cropMarkOffset : corner.y + cropMarkOffset + cropMarkLength;

    page.drawLine({
      start: { x: corner.x, y: vStart },
      end: { x: corner.x, y: vEnd },
      color: rgb(0, 0, 0),
      thickness: LINE_WIDTH,
    });
  }
};
