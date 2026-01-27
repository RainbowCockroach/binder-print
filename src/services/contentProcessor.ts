import * as pdfjsLib from 'pdfjs-dist';
import type { ContentPage } from '../types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

let pageIdCounter = 0;

const generatePageId = (): string => {
  return `page-${++pageIdCounter}-${Date.now()}`;
};

export const processImage = async (file: File): Promise<ContentPage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: generatePageId(),
          type: 'image',
          dataUrl,
          originalWidth: img.width,
          originalHeight: img.height,
          position: { x: 0, y: 0, scale: 1 },
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const processPdf = async (file: File): Promise<ContentPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: ContentPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    pages.push({
      id: generatePageId(),
      type: 'pdf-page',
      dataUrl,
      originalWidth: viewport.width,
      originalHeight: viewport.height,
      position: { x: 0, y: 0, scale: 1 },
    });
  }

  return pages;
};

export const processFiles = async (files: File[]): Promise<ContentPage[]> => {
  const allPages: ContentPage[] = [];

  for (const file of files) {
    const fileType = file.type.toLowerCase();

    if (fileType === 'application/pdf') {
      const pdfPages = await processPdf(file);
      allPages.push(...pdfPages);
    } else if (fileType.startsWith('image/')) {
      const imagePage = await processImage(file);
      allPages.push(imagePage);
    } else {
      console.warn(`Unsupported file type: ${fileType}`);
    }
  }

  return allPages;
};

// Calculate the initial scale to fit content within the target area
export const calculateFitScale = (
  contentWidth: number,
  contentHeight: number,
  targetWidth: number,
  targetHeight: number
): number => {
  const scaleX = targetWidth / contentWidth;
  const scaleY = targetHeight / contentHeight;
  return Math.min(scaleX, scaleY);
};

// Calculate scale to fill the target area (may crop)
export const calculateFillScale = (
  contentWidth: number,
  contentHeight: number,
  targetWidth: number,
  targetHeight: number
): number => {
  const scaleX = targetWidth / contentWidth;
  const scaleY = targetHeight / contentHeight;
  return Math.max(scaleX, scaleY);
};
