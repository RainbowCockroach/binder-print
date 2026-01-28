import { PDFDocument } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import type { ContentPage, GeneratePdfOptions } from '../types';
import { PAPER_SIZES } from '../types';
import { getContentArea } from './binderSpecs';
import { drawOutline } from './outlineGenerator';

// Convert mm to PDF points (1 inch = 72 points, 1 inch = 25.4 mm)
const mmToPoints = (mm: number): number => (mm / 25.4) * 72;

// Convert pixels to mm (assuming 96 DPI for screen, but we use actual dimensions)
const pxToMm = (px: number, dpi: number = 96): number => (px / dpi) * 25.4;

/**
 * Generate a duplex-ready PDF with alternating content and outline pages.
 * Each content page uses its own pageSide setting for hole placement.
 */
export const generatePdf = async (options: GeneratePdfOptions): Promise<Uint8Array> => {
  const { pages, binderType, paperSize, enablePadding } = options;

  const pdfDoc = await PDFDocument.create();
  const paper = PAPER_SIZES[paperSize];

  const pageWidthPt = mmToPoints(paper.width);
  const pageHeightPt = mmToPoints(paper.height);

  // Generate one content page + one outline page for each uploaded page
  for (const contentPage of pages) {
    // Use the page's own pageSide setting
    const pageSide = contentPage.pageSide;

    // Add content page
    const contentPdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    await drawContentPage(pdfDoc, contentPdfPage, contentPage, binderType, paperSize, pageSide, enablePadding);

    // Add outline page (back side)
    const outlinePdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    drawOutline(outlinePdfPage, binderType, paperSize, pageSide);
  }

  return pdfDoc.save();
};

/**
 * Draw content on a full page
 */
const drawContentPage = async (
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  contentPage: ContentPage,
  binderType: GeneratePdfOptions['binderType'],
  paperSize: 'A4' | 'A5',
  pageSide: GeneratePdfOptions['pageSide'],
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
