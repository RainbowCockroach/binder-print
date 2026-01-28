import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import type { ContentPage, GeneratePdfOptions, BinderType, PageSide } from '../types';
import { PAPER_SIZES } from '../types';
import { BINDER_SPECS, getContentArea } from './binderSpecs';
import { drawOutline } from './outlineGenerator';

// Convert mm to PDF points (1 inch = 72 points, 1 inch = 25.4 mm)
const mmToPoints = (mm: number): number => (mm / 25.4) * 72;

// Convert pixels to mm (assuming 96 DPI for screen, but we use actual dimensions)
const pxToMm = (px: number, dpi: number = 96): number => (px / dpi) * 25.4;

/**
 * Generate a duplex-ready PDF with alternating content and outline pages
 */
export const generatePdf = async (options: GeneratePdfOptions): Promise<Uint8Array> => {
  const { pages, binderType, paperSize, pageSide, enablePadding } = options;

  const pdfDoc = await PDFDocument.create();
  const spec = BINDER_SPECS[binderType];
  const paper = PAPER_SIZES[paperSize];

  const pageWidthPt = mmToPoints(paper.width);
  const pageHeightPt = mmToPoints(paper.height);

  // Determine if we should use 2-up mode
  const use2Up = paperSize === 'A4' && spec.paperSize === 'A5' && pages.length > 1;

  if (use2Up) {
    // 2-up mode: two A5 pages per A4 sheet
    await generate2UpPages(pdfDoc, pages, binderType, pageSide, enablePadding);
  } else {
    // Single page mode
    for (const contentPage of pages) {
      // Add content page
      const contentPdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
      await drawContentPage(pdfDoc, contentPdfPage, contentPage, binderType, paperSize, pageSide, enablePadding);

      // Add outline page (back side)
      const outlinePdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
      drawOutline(outlinePdfPage, binderType, paperSize, pageSide);
    }
  }

  return pdfDoc.save();
};

/**
 * Generate 2-up pages (two A5 content pages per A4 sheet)
 */
const generate2UpPages = async (
  pdfDoc: PDFDocument,
  pages: ContentPage[],
  binderType: BinderType,
  pageSide: PageSide,
  enablePadding: boolean
): Promise<void> => {
  const paper = PAPER_SIZES.A4;
  const a5Paper = PAPER_SIZES.A5;

  const pageWidthPt = mmToPoints(paper.width);
  const pageHeightPt = mmToPoints(paper.height);
  const a5WidthPt = mmToPoints(a5Paper.width);
  const a5HeightPt = mmToPoints(a5Paper.height);

  // Process pages in pairs
  for (let i = 0; i < pages.length; i += 2) {
    const firstPage = pages[i];
    const secondPage = pages[i + 1]; // May be undefined if odd number of pages

    // Content page (front)
    const contentPdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // Draw first A5 content at top half of A4
    await drawContentPageAt(
      pdfDoc,
      contentPdfPage,
      firstPage,
      binderType,
      pageSide,
      enablePadding,
      0, // x offset
      pageHeightPt - a5HeightPt, // y offset (top)
      a5WidthPt,
      a5HeightPt
    );

    // Draw second A5 content at bottom half (if exists)
    if (secondPage) {
      await drawContentPageAt(
        pdfDoc,
        contentPdfPage,
        secondPage,
        binderType,
        pageSide,
        enablePadding,
        0, // x offset
        0, // y offset (bottom)
        a5WidthPt,
        a5HeightPt
      );
    }

    // Outline page (back) - mirrored
    const outlinePdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // Draw outline for first page (mirrored position: bottom when flipped)
    drawOutlineAt(outlinePdfPage, binderType, pageSide, pageWidthPt - a5WidthPt, 0, a5WidthPt, a5HeightPt);

    // Draw outline for second page (mirrored position: top when flipped)
    if (secondPage) {
      drawOutlineAt(
        outlinePdfPage,
        binderType,
        pageSide,
        pageWidthPt - a5WidthPt,
        pageHeightPt - a5HeightPt,
        a5WidthPt,
        a5HeightPt
      );
    }
  }
};

/**
 * Draw content on a full page
 */
const drawContentPage = async (
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  contentPage: ContentPage,
  binderType: BinderType,
  paperSize: 'A4' | 'A5',
  pageSide: PageSide,
  enablePadding: boolean
): Promise<void> => {
  const paper = PAPER_SIZES[paperSize];
  const pageHeightPt = mmToPoints(paper.height);

  // Calculate content area (includes centering offset for A5 on A4)
  const contentArea = getContentArea(binderType, paperSize, pageSide, enablePadding);

  // Embed and draw the image
  const imageBytes = await fetch(contentPage.dataUrl).then((res) => res.arrayBuffer());
  let image;

  if (contentPage.dataUrl.includes('image/png')) {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    image = await pdfDoc.embedJpg(imageBytes);
  }

  // Calculate image dimensions based on position settings
  const { position } = contentPage;
  const imgWidthMm = pxToMm(contentPage.originalWidth, 150); // Assume 150 DPI for content
  const imgHeightMm = pxToMm(contentPage.originalHeight, 150);

  const scaledWidth = imgWidthMm * position.scale;
  const scaledHeight = imgHeightMm * position.scale;

  // Position image within content area
  // contentArea.offsetX/Y already include the centering offset for A5 on A4
  const imgX = mmToPoints(contentArea.offsetX + position.x);
  const imgY = mmToPoints(contentArea.offsetY + position.y);

  pdfPage.drawImage(image, {
    x: imgX,
    y: pageHeightPt - imgY - mmToPoints(scaledHeight), // PDF y is from bottom
    width: mmToPoints(scaledWidth),
    height: mmToPoints(scaledHeight),
  });
};

/**
 * Draw content at a specific position (for 2-up mode)
 */
const drawContentPageAt = async (
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  contentPage: ContentPage,
  binderType: BinderType,
  pageSide: PageSide,
  enablePadding: boolean,
  areaX: number,
  areaY: number,
  _areaWidth: number,
  areaHeight: number
): Promise<void> => {
  const spec = BINDER_SPECS[binderType];
  const padding = enablePadding ? 5 : 0;
  const holeMargin = mmToPoints(spec.edgeDistance + spec.holeDiameter / 2 + padding);

  // Embed and draw the image
  const imageBytes = await fetch(contentPage.dataUrl).then((res) => res.arrayBuffer());
  let image;

  if (contentPage.dataUrl.includes('image/png')) {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    image = await pdfDoc.embedJpg(imageBytes);
  }

  // Calculate image dimensions
  const { position } = contentPage;
  const imgWidthMm = pxToMm(contentPage.originalWidth, 150);
  const imgHeightMm = pxToMm(contentPage.originalHeight, 150);

  const scaledWidthPt = mmToPoints(imgWidthMm * position.scale);
  const scaledHeightPt = mmToPoints(imgHeightMm * position.scale);

  // Adjust X based on page side
  let imgX = areaX + mmToPoints(position.x);
  if (pageSide === 'right') {
    imgX += holeMargin;
  }

  pdfPage.drawImage(image, {
    x: imgX,
    y: areaY + areaHeight - scaledHeightPt - mmToPoints(position.y),
    width: scaledWidthPt,
    height: scaledHeightPt,
  });
};

/**
 * Draw outline at a specific position (for 2-up mode)
 */
const drawOutlineAt = (
  pdfPage: PDFPage,
  binderType: BinderType,
  pageSide: PageSide,
  areaX: number,
  areaY: number,
  areaWidth: number,
  areaHeight: number
): void => {
  const spec = BINDER_SPECS[binderType];
  const binderPaper = PAPER_SIZES[spec.paperSize];

  const LINE_WIDTH = 1;
  const holeDiameter = mmToPoints(spec.holeDiameter);
  const holeRadius = holeDiameter / 2;
  const edgeDistance = mmToPoints(spec.edgeDistance);

  // Draw trim rectangle
  pdfPage.drawRectangle({
    x: areaX,
    y: areaY,
    width: areaWidth,
    height: areaHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: LINE_WIDTH,
  });

  // Draw holes
  const holePositions = spec.getHolePositions(binderPaper.height);

  // For mirrored outline, hole position is flipped
  let holeX: number;
  if (pageSide === 'left') {
    // Original: holes on right. Mirrored: holes on left
    holeX = areaX + edgeDistance;
  } else {
    // Original: holes on left. Mirrored: holes on right
    holeX = areaX + areaWidth - edgeDistance;
  }

  for (const posY of holePositions) {
    const holeY = areaY + mmToPoints(posY);

    pdfPage.drawCircle({
      x: holeX,
      y: holeY,
      size: holeRadius,
      borderColor: rgb(0, 0, 0),
      borderWidth: LINE_WIDTH,
    });
  }

  // Draw crop marks
  const cropMarkLength = mmToPoints(5);
  const cropMarkOffset = mmToPoints(3);

  const corners = [
    { x: areaX, y: areaY },
    { x: areaX + areaWidth, y: areaY },
    { x: areaX, y: areaY + areaHeight },
    { x: areaX + areaWidth, y: areaY + areaHeight },
  ];

  for (const corner of corners) {
    const isLeft = corner.x === areaX;
    const isBottom = corner.y === areaY;

    // Horizontal mark
    const hStart = isLeft ? corner.x - cropMarkOffset - cropMarkLength : corner.x + cropMarkOffset;
    const hEnd = isLeft ? corner.x - cropMarkOffset : corner.x + cropMarkOffset + cropMarkLength;

    pdfPage.drawLine({
      start: { x: hStart, y: corner.y },
      end: { x: hEnd, y: corner.y },
      color: rgb(0, 0, 0),
      thickness: LINE_WIDTH,
    });

    // Vertical mark
    const vStart = isBottom ? corner.y - cropMarkOffset - cropMarkLength : corner.y + cropMarkOffset;
    const vEnd = isBottom ? corner.y - cropMarkOffset : corner.y + cropMarkOffset + cropMarkLength;

    pdfPage.drawLine({
      start: { x: corner.x, y: vStart },
      end: { x: corner.x, y: vEnd },
      color: rgb(0, 0, 0),
      thickness: LINE_WIDTH,
    });
  }
};
