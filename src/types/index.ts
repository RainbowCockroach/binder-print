// Paper sizes in mm
export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
} as const;

export type PaperSize = keyof typeof PAPER_SIZES;

export type BinderType =
  | 'a5-20-hole'
  | 'a5-2-hole'
  | 'a5-6-hole-filofax'
  | 'a5-6-hole-standard'
  | 'a4-4-hole';

export type PageSide = 'left' | 'right';

export interface BinderSpec {
  id: BinderType;
  name: string;
  paperSize: PaperSize;
  holeCount: number;
  holeDiameter: number; // mm
  edgeDistance: number; // mm from paper edge to hole center
  // Function to calculate hole positions (y coordinates from top of page)
  getHolePositions: (pageHeight: number) => number[];
}

export interface ContentPage {
  id: string;
  type: 'image' | 'pdf-page';
  dataUrl: string; // Base64 data URL for preview
  originalWidth: number; // pixels
  originalHeight: number; // pixels
  // Position and crop settings
  position: {
    x: number; // offset in mm (can be negative)
    y: number; // offset in mm (can be negative)
    scale: number; // scale factor (1 = 100%)
  };
}

export interface AppState {
  files: File[];
  pages: ContentPage[];
  binderType: BinderType;
  paperSize: PaperSize;
  pageSide: PageSide;
  enablePadding: boolean;
  isProcessing: boolean;
  selectedPageIndex: number | null;
}

export interface GeneratePdfOptions {
  pages: ContentPage[];
  binderType: BinderType;
  paperSize: PaperSize;
  pageSide: PageSide;
  enablePadding: boolean;
}
