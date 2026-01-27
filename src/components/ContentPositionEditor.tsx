import { useCallback, useRef, useState, useEffect } from 'react';
import type { ContentPage, BinderType, PaperSize, PageSide } from '../types';
import { PAPER_SIZES } from '../types';
import { BINDER_SPECS, getContentArea } from '../services/binderSpecs';

interface ContentPositionEditorProps {
  page: ContentPage;
  binderType: BinderType;
  paperSize: PaperSize;
  pageSide: PageSide;
  enablePadding: boolean;
  onPositionChange: (position: ContentPage['position']) => void;
  onClose: () => void;
}

const PREVIEW_SCALE = 2; // Scale factor for preview (pixels per mm)

export const ContentPositionEditor = ({
  page,
  binderType,
  paperSize,
  pageSide,
  enablePadding,
  onPositionChange,
  onClose,
}: ContentPositionEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(page.position);

  const spec = BINDER_SPECS[binderType];
  const paper = PAPER_SIZES[paperSize];
  const binderPaper = PAPER_SIZES[spec.paperSize];
  const contentArea = getContentArea(binderType, paperSize, pageSide, enablePadding);

  // Preview dimensions
  const previewWidth = paper.width * PREVIEW_SCALE;
  const previewHeight = paper.height * PREVIEW_SCALE;

  // Content area in preview coordinates
  const contentAreaPreview = {
    x: ((paper.width - binderPaper.width) / 2 + (pageSide === 'right' ? contentArea.offsetX : 0)) * PREVIEW_SCALE,
    y: ((paper.height - binderPaper.height) / 2) * PREVIEW_SCALE,
    width: contentArea.width * PREVIEW_SCALE,
    height: contentArea.height * PREVIEW_SCALE,
  };

  // Image dimensions (assuming 150 DPI)
  const imgWidthMm = (page.originalWidth / 150) * 25.4;
  const imgHeightMm = (page.originalHeight / 150) * 25.4;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x * PREVIEW_SCALE,
        y: e.clientY - position.y * PREVIEW_SCALE,
      });
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = (e.clientX - dragStart.x) / PREVIEW_SCALE;
      const newY = (e.clientY - dragStart.y) / PREVIEW_SCALE;

      setPosition((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setPosition((prev) => ({ ...prev, scale: newScale }));
  };

  const handleFitToArea = () => {
    const scaleX = contentArea.width / imgWidthMm;
    const scaleY = contentArea.height / imgHeightMm;
    const fitScale = Math.min(scaleX, scaleY);

    // Center the image
    const scaledWidth = imgWidthMm * fitScale;
    const scaledHeight = imgHeightMm * fitScale;
    const centerX = (contentArea.width - scaledWidth) / 2;
    const centerY = (contentArea.height - scaledHeight) / 2;

    setPosition({ x: centerX, y: centerY, scale: fitScale });
  };

  const handleFillArea = () => {
    const scaleX = contentArea.width / imgWidthMm;
    const scaleY = contentArea.height / imgHeightMm;
    const fillScale = Math.max(scaleX, scaleY);

    // Center the image
    const scaledWidth = imgWidthMm * fillScale;
    const scaledHeight = imgHeightMm * fillScale;
    const centerX = (contentArea.width - scaledWidth) / 2;
    const centerY = (contentArea.height - scaledHeight) / 2;

    setPosition({ x: centerX, y: centerY, scale: fillScale });
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  const handleApply = () => {
    onPositionChange(position);
    onClose();
  };

  // Calculate hole positions for visualization
  const holePositions = spec.getHolePositions(binderPaper.height);
  const holeX =
    pageSide === 'left'
      ? ((paper.width - binderPaper.width) / 2 + binderPaper.width - spec.edgeDistance) * PREVIEW_SCALE
      : ((paper.width - binderPaper.width) / 2 + spec.edgeDistance) * PREVIEW_SCALE;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Position Content</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex gap-6">
            {/* Preview area */}
            <div
              ref={containerRef}
              className="relative bg-gray-100 border border-gray-300 overflow-hidden flex-shrink-0"
              style={{ width: previewWidth, height: previewHeight }}
            >
              {/* Paper outline */}
              <div
                className="absolute bg-white border border-gray-400"
                style={{
                  left: 0,
                  top: 0,
                  width: previewWidth,
                  height: previewHeight,
                }}
              />

              {/* Binder page outline (for A5 on A4) */}
              {paperSize !== spec.paperSize && (
                <div
                  className="absolute border-2 border-dashed border-blue-300"
                  style={{
                    left: ((paper.width - binderPaper.width) / 2) * PREVIEW_SCALE,
                    top: ((paper.height - binderPaper.height) / 2) * PREVIEW_SCALE,
                    width: binderPaper.width * PREVIEW_SCALE,
                    height: binderPaper.height * PREVIEW_SCALE,
                  }}
                />
              )}

              {/* Content area */}
              <div
                className="absolute border-2 border-green-500 bg-green-50/30"
                style={{
                  left: contentAreaPreview.x,
                  top: contentAreaPreview.y,
                  width: contentAreaPreview.width,
                  height: contentAreaPreview.height,
                }}
              />

              {/* Hole indicators */}
              {holePositions.map((posY, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border-2 border-gray-400 bg-gray-200"
                  style={{
                    left: holeX - (spec.holeDiameter * PREVIEW_SCALE) / 2,
                    top:
                      ((paper.height - binderPaper.height) / 2 + posY) * PREVIEW_SCALE -
                      (spec.holeDiameter * PREVIEW_SCALE) / 2,
                    width: spec.holeDiameter * PREVIEW_SCALE,
                    height: spec.holeDiameter * PREVIEW_SCALE,
                  }}
                />
              ))}

              {/* Draggable image */}
              <div
                className={`absolute cursor-move ${isDragging ? 'opacity-80' : ''}`}
                style={{
                  left: contentAreaPreview.x + position.x * PREVIEW_SCALE,
                  top: contentAreaPreview.y + position.y * PREVIEW_SCALE,
                  width: imgWidthMm * position.scale * PREVIEW_SCALE,
                  height: imgHeightMm * position.scale * PREVIEW_SCALE,
                }}
                onMouseDown={handleMouseDown}
              >
                <img
                  src={page.dataUrl}
                  alt="Content"
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale: {(position.scale * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={position.scale}
                  onChange={handleScaleChange}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleFitToArea}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Fit to Area
                </button>
                <button
                  onClick={handleFillArea}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Fill Area
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium col-span-2"
                >
                  Reset Position
                </button>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <span className="font-medium">Green area:</span> Content area
                </p>
                <p>
                  <span className="font-medium">Blue dashed:</span> Binder page size
                </p>
                <p>
                  <span className="font-medium">Gray circles:</span> Hole positions
                </p>
                <p className="mt-2">Drag the image to position it. Use the slider to scale.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleApply} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
